import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, ApiError } from './apiClient'

/**
 * The client is the one place where cookies, the CSRF double-submit and the
 * silent refresh are implemented, so it is the one place where a subtle
 * regression would be invisible everywhere else.
 */

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const failure = (status: number, error: { code: string; message: string; details?: Array<{ path: string; message: string }> }) =>
  new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

let fetchMock: ReturnType<typeof vi.fn>

const setCsrfCookie = (token: string) => {
  document.cookie = `sc_csrf=${encodeURIComponent(token)}; path=/`
}

const clearCookies = () => {
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

beforeEach(() => {
  clearCookies()
  // Most tests are not about CSRF, so a token is present by default. The two
  // priming tests clear it to exercise a first-time visitor.
  setCsrfCookie('token-abc')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('envelope handling', () => {
  it('unwraps the data field so callers never see the envelope', async () => {
    fetchMock.mockResolvedValueOnce(ok({ products: [] }))

    await expect(apiClient.get('/api/products')).resolves.toEqual({ products: [] })
  })

  it('returns undefined for a 204 rather than failing to parse it', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(apiClient.delete('/api/cart')).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying the backend code and status', async () => {
    fetchMock.mockResolvedValueOnce(failure(404, { code: 'PRODUCT_NOT_FOUND', message: 'No such product' }))

    const error = await apiClient.get('/api/products/nope').catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'PRODUCT_NOT_FOUND' })
    expect((error as ApiError).isUnauthenticated).toBe(false)
  })

  it('surfaces a validation failure as per-field messages', async () => {
    fetchMock.mockResolvedValueOnce(
      failure(400, {
        code: 'VALIDATION_ERROR',
        message: 'The request body is invalid',
        details: [{ path: 'email', message: 'Enter a valid email address' }],
      }),
    )

    const error = (await apiClient.post('/api/auth/login').catch((cause: unknown) => cause)) as ApiError

    expect(error.fieldErrors).toEqual({ email: 'Enter a valid email address' })
  })
})

describe('query strings', () => {
  it('drops null, undefined and empty values so no bare keys are sent', async () => {
    fetchMock.mockResolvedValueOnce(ok({ items: [] }))

    await apiClient.get('/api/products', { search: 'saree', category: undefined, sort: null, page: '' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/products?search=saree'),
      expect.anything(),
    )
  })

  it('sends no question mark when every value was dropped', async () => {
    fetchMock.mockResolvedValueOnce(ok({ items: [] }))

    await apiClient.get('/api/products', { search: '' })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/products')
  })

  it('appends query parameters to a delete request', async () => {
    fetchMock.mockResolvedValueOnce(ok({ deleted: [] }))

    await apiClient.delete('/api/admin/products/p1/permanent', { force: true })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/admin/products/p1/permanent?force=true')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })
})

describe('cookies and CSRF', () => {
  it('always sends credentials so the httpOnly session cookie travels', async () => {
    fetchMock.mockResolvedValueOnce(ok({ products: [] }))

    await apiClient.get('/api/products')

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' })
  })

  it('does not fetch a token or set the header on a safe method', async () => {
    setCsrfCookie('token-abc')
    fetchMock.mockResolvedValueOnce(ok({ products: [] }))

    await apiClient.get('/api/products')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('X-CSRF-Token')
  })

  it('echoes an existing token on a write without an extra round trip', async () => {
    setCsrfCookie('token-abc')
    fetchMock.mockResolvedValueOnce(ok({ cart: {} }))

    await apiClient.post('/api/cart/items', { productId: 'p1', quantity: 1 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].headers['X-CSRF-Token']).toBe('token-abc')
  })

  it('primes the cookie first when a first-time visitor has none', async () => {
    clearCookies()
    fetchMock
      .mockImplementationOnce(async () => {
        // The priming response sets the cookie, exactly as the browser would.
        setCsrfCookie('fresh-token')
        return ok({ csrfToken: 'fresh-token' })
      })
      .mockResolvedValueOnce(ok({ cart: {} }))

    await apiClient.post('/api/cart/items', { productId: 'p1', quantity: 1 })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/auth/csrf')
    expect(fetchMock.mock.calls[1][1].headers['X-CSRF-Token']).toBe('fresh-token')
  })

  it('shares one priming request between callers that race', async () => {
    clearCookies()
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) {
        setCsrfCookie('shared-token')
        return ok({ csrfToken: 'shared-token' })
      }
      return ok({ cart: {} })
    })

    await Promise.all([apiClient.post('/api/cart/items', {}), apiClient.post('/api/cart/items', {})])

    const primeCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/auth/csrf'))
    expect(primeCalls).toHaveLength(1)
  })
})

describe('silent refresh and replay', () => {
  it('refreshes once and replays the original request after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(failure(401, { code: 'UNAUTHENTICATED', message: 'Session expired' }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(ok({ items: [] }))

    await expect(apiClient.get('/api/cart')).resolves.toEqual({ items: [] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a second time, so a dead session surfaces as a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(failure(401, { code: 'UNAUTHENTICATED', message: 'Session expired' }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(failure(401, { code: 'UNAUTHENTICATED', message: 'Session expired' }))

    const error = (await apiClient.get('/api/cart').catch((cause: unknown) => cause)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.isUnauthenticated).toBe(true)
  })

  it('rethrows the original error when the refresh itself fails', async () => {
    fetchMock
      .mockResolvedValueOnce(failure(401, { code: 'UNAUTHENTICATED', message: 'Session expired' }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))

    const error = (await apiClient.get('/api/cart').catch((cause: unknown) => cause)) as ApiError

    expect(error.status).toBe(401)
    // No third call: the replay only happens when the refresh succeeded.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('collapses parallel 401s into a single refresh', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).endsWith('/api/auth/refresh')) return new Response(null, { status: 200 })
      if (String(url).includes('/api/cart')) {
        // The first hit per request path is unauthorised, the replay succeeds.
        const seen = fetchMock.mock.calls.filter(([called]) => String(called) === String(url)).length
        if (seen === 1) return failure(401, { code: 'UNAUTHENTICATED', message: 'Session expired' })
        return ok({ items: [] })
      }
      return ok({ items: [] })
    })

    await Promise.all([apiClient.get('/api/cart/items'), apiClient.get('/api/cart/items')])

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })

  it('leaves a 403 alone, since a refresh can never grant permission', async () => {
    fetchMock.mockResolvedValueOnce(failure(403, { code: 'FORBIDDEN', message: 'Admins only' }))

    const error = (await apiClient.get('/api/admin/orders').catch((cause: unknown) => cause)) as ApiError

    expect(error.isForbidden).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not refresh or resubmit credentials when a sign-in is rejected', async () => {
    fetchMock.mockResolvedValueOnce(
      failure(401, { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' }),
    )

    const error = (await apiClient
      .post('/api/auth/login', { email: 'a@b.com', password: 'wrong' })
      .catch((cause: unknown) => cause)) as ApiError

    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
    // One POST, not a refresh plus a replay: resubmitting a password the server
    // just refused is pointless and reads as repeated guessing.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/auth/refresh'))).toBe(false)
  })

  it('does not refresh or replay a rejected registration', async () => {
    fetchMock.mockResolvedValueOnce(
      failure(401, { code: 'INVALID_CREDENTIALS', message: 'Email already in use' }),
    )

    await apiClient.post('/api/auth/register', { email: 'a@b.com' }).catch(() => undefined)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('bodies', () => {
  it('serialises a JSON body and sets the content type', async () => {
    fetchMock.mockResolvedValueOnce(ok({ cart: {} }))

    await apiClient.post('/api/cart/items', { productId: 'p1', quantity: 2 })

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', quantity: 2 }),
    })
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
  })

  it('never sets a content type for a multipart upload', async () => {
    const form = new FormData()
    form.append('images', new Blob(['x']), 'a.png')
    fetchMock.mockResolvedValueOnce(ok({ product: {} }))

    await apiClient.upload('/api/admin/products/p1/images', form)

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Content-Type')
    expect(fetchMock.mock.calls[0][1].body).toBe(form)
  })
})
