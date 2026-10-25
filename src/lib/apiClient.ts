/**
 * The single place the browser talks to the backend.
 *
 * Everything the API does that a bare `fetch` does not is handled here:
 *
 *  - unwrapping the `{ success, data }` / `{ success, error }` envelope, so
 *    callers only ever see `data` or a thrown `ApiError`
 *  - `credentials: 'include'`, without which the httpOnly session cookies are
 *    neither stored nor sent
 *  - the double-submit CSRF token, which every non-GET request must echo
 *  - one silent `POST /api/auth/refresh` when the access cookie has expired,
 *    followed by a replay of the original request
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

const CSRF_COOKIE = 'sc_csrf'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Endpoints whose 401 is an answer rather than an expired session.
 *
 * A rejected credential check can never be repaired by minting a new access
 * cookie, so these skip the refresh-and-replay path. Without this a single wrong
 * password costs an extra `POST /api/auth/refresh` plus a second `POST` of the
 * same credentials, which both wastes the round trip and looks like repeated
 * guessing to anything rate-limiting the route.
 */
const NO_REFRESH_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/refresh'])

/** A failed API call, carrying the machine-readable code the backend sent. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Array<{ path: string; message: string }>

  constructor(status: number, code: string, message: string, details: ApiError['details'] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** True when the caller should send the shopper to the sign-in page. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  /** Maps a validation failure onto a `{ field: message }` object for forms. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((detail) => [detail.path, detail.message]))
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: ApiError['details'] }
}

/**
 * The CSRF cookie is deliberately not httpOnly, because the browser has to be
 * able to read it in order to echo it back in a header.
 */
function readCsrfToken(): string | null {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CSRF_COOKIE}=`))

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

let csrfPrimed: Promise<void> | null = null

/**
 * Fetches the CSRF cookie if we do not have one yet. A first-time visitor has no
 * cookie at all, and the two endpoints that can create a session (login and
 * register) are exempt from the check, so this only has to succeed before writes.
 */
async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfToken()
  if (existing) return existing

  csrfPrimed ??= fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: 'include' })
    .then((response) => (response.ok ? undefined : Promise.reject(new Error('Could not obtain a security token'))))
    .finally(() => {
      csrfPrimed = null
    })

  await csrfPrimed
  return readCsrfToken()
}

/** Any object whose values can be rendered as a query string. */
export type QueryParams = object

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: QueryParams
  /** Set for `FormData` bodies so the browser can pick its own multipart boundary. */
  formData?: FormData
  signal?: AbortSignal
}

/** Drops null/undefined/empty values so we never send `?search=`. */
function buildQueryString(query: QueryParams | undefined): string {
  if (!query) return ''

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    params.set(key, String(value))
  }

  const search = params.toString()
  return search ? `?${search}` : ''
}

async function toApiError(response: Response): Promise<ApiError> {
  let envelope: Envelope<unknown> | null = null

  try {
    envelope = (await response.json()) as Envelope<unknown>
  } catch {
    envelope = null
  }

  return new ApiError(
    response.status,
    envelope?.error?.code ?? 'UNEXPECTED_ERROR',
    envelope?.error?.message ?? `Request failed with status ${response.status}`,
    envelope?.error?.details ?? [],
  )
}

async function send<T>(path: string, options: RequestOptions): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (!SAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken()
    if (token) headers['X-CSRF-Token'] = token
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
    method,
    headers,
    // Required for the httpOnly session cookies to work cross-origin.
    credentials: 'include',
    signal: options.signal,
    body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  // 204 and friends have nothing to parse.
  if (response.status === 204) {
    return undefined as T
  }

  const envelope = (await response.json()) as Envelope<T>
  return envelope.data as T
}

/**
 * A single in-flight refresh, shared by every request that races into a 401. Ten
 * parallel cart calls must not trigger ten refreshes.
 */
let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

async function request<T>(path: string, options: RequestOptions, isRetry = false): Promise<T> {
  try {
    return await send<T>(path, options)
  } catch (error) {
    // An expired access cookie is recoverable exactly once, so the original
    // request is replayed after a successful refresh. A 401 from a credential
    // endpoint is excluded, because replaying it would resubmit the same
    // rejected credentials.
    const isRecoverable =
      error instanceof ApiError && error.isUnauthenticated && !NO_REFRESH_PATHS.has(path)

    if (isRecoverable && !isRetry && (await refreshSession())) {
      return request<T>(path, options, true)
    }

    throw error
  }
}

export const apiClient = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),

  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),

  delete: <T>(path: string, query?: QueryParams) => request<T>(path, { method: 'DELETE', query }),

  /** Multipart upload. Never set Content-Type by hand or the boundary is lost. */
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', formData }),
}
