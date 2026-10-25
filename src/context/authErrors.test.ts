import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/apiClient'
import { authFieldErrors, describeAuthError, describeLoginError, resolveAuthError } from './authErrors'

/**
 * `resolveAuthError` decides which failed request reaches the form. It
 * previously picked the mutation that was *pending*, which is only true before
 * the failure exists, so a rejected sign-in reported nothing at all. These cases
 * pin the question it asks: which mutation settled with an error.
 */

const failed = (error: unknown) => ({ isError: true, error })
const idle = { isError: false, error: null }

describe('resolveAuthError', () => {
  it('reports a settled login failure even though it is no longer pending', () => {
    const loginError = new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect')

    expect(resolveAuthError(failed(loginError), idle)).toEqual({
      source: 'login',
      error: loginError,
    })
  })

  it('reports a settled register failure when login never ran', () => {
    const registerError = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed')

    expect(resolveAuthError(idle, failed(registerError))).toEqual({
      source: 'register',
      error: registerError,
    })
  })

  it('returns null when neither mutation failed, including mid-flight', () => {
    const pending = { isError: false, error: null }

    expect(resolveAuthError(pending, pending)).toBeNull()
  })

  it('never returns null while a mutation is in the error state', () => {
    const states = [
      resolveAuthError(failed(new Error('x')), idle),
      resolveAuthError(idle, failed(new Error('y'))),
      resolveAuthError(failed(new Error('x')), failed(new Error('y'))),
    ]

    expect(states.every((state) => state !== null)).toBe(true)
  })
})

describe('describeAuthError', () => {
  it('uses the message the backend sent', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed')

    expect(describeAuthError(error)).toBe('Validation failed')
  })

  it('explains an unreachable API rather than showing a raw fetch failure', () => {
    expect(describeAuthError(new TypeError('Failed to fetch'))).toBe(
      'We could not reach the store. Please check your connection and try again.',
    )
  })

  it('falls back to a generic sentence for anything unrecognised', () => {
    expect(describeAuthError(new Error('boom'))).toBe('Something went wrong. Please try again.')
    expect(describeAuthError(null)).toBe('Something went wrong. Please try again.')
  })
})

describe('describeLoginError', () => {
  it('reads the same for a well-formed address with the wrong password', () => {
    const error = new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect')

    expect(describeLoginError(error)).toBe('Email or password is incorrect')
  })

  it('reads the same for a malformed address, which fails validation first', () => {
    // The backend never reaches its credentials check here: `z.string().email()`
    // rejects the request body with this developer-facing message instead.
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
      { path: 'email', message: 'Invalid email' },
    ])

    expect(describeLoginError(error)).toBe('Email or password is incorrect')
  })

  it('leaves a failure the shopper can act on differently alone', () => {
    expect(describeLoginError(new ApiError(403, 'ACCOUNT_DISABLED', 'This account has been deactivated'))).toBe(
      'This account has been deactivated',
    )
    expect(describeLoginError(new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.'))).toBe(
      'Too many requests. Please try again shortly.',
    )
  })

  it('still explains an unreachable API and an unknown failure', () => {
    expect(describeLoginError(new TypeError('Failed to fetch'))).toContain('could not reach the store')
    expect(describeLoginError(new Error('boom'))).toBe('Something went wrong. Please try again.')
  })
})

describe('authFieldErrors', () => {
  it('maps a 400 onto per-field messages for registration', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
      { path: 'email', message: 'Enter a valid email address' },
      { path: 'name', message: 'Name is required' },
    ])

    expect(authFieldErrors(error, 'register')).toEqual({
      email: 'Enter a valid email address',
      name: 'Name is required',
    })
  })

  it('gives sign-in no per-field detail, so it cannot contradict the banner', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
      { path: 'email', message: 'Invalid email' },
    ])

    expect(authFieldErrors(error, 'login')).toEqual({})
  })

  it('has nothing to say about a rejected credential', () => {
    expect(authFieldErrors(new ApiError(401, 'INVALID_CREDENTIALS', 'Nope'), 'register')).toEqual({})
    expect(authFieldErrors(null, 'register')).toEqual({})
  })
})