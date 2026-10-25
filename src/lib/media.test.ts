import { describe, expect, it, vi } from 'vitest'
import { resolveMediaUrl } from './media'

const API_BASE = 'http://localhost:3000'

vi.mock('./apiClient', () => ({ API_BASE_URL: 'http://localhost:3000' }))

describe('resolveMediaUrl', () => {
  it('pins a relative backend path to the API origin', () => {
    expect(resolveMediaUrl('/uploads/abc.jpg')).toBe(`${API_BASE}/uploads/abc.jpg`)
  })

  it('leaves absolute URLs alone', () => {
    const url = 'https://images.unsplash.com/photo-1'
    expect(resolveMediaUrl(url)).toBe(url)
  })

  it('leaves blob previews alone', () => {
    const blob = 'blob:http://localhost:5173/abc-123'
    expect(resolveMediaUrl(blob)).toBe(blob)
  })

  it('returns an empty string for missing sources', () => {
    expect(resolveMediaUrl(null)).toBe('')
    expect(resolveMediaUrl(undefined)).toBe('')
  })
})