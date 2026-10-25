import { beforeEach, describe, expect, it } from 'vitest'
import { clearGuestState, guestCart, guestWishlist, readGuestState } from './guestStore'

/**
 * The guest bag is the only cart a signed-out shopper has, and it is posted to the
 * server verbatim at sign-in. These tests pin the two properties that matter: it
 * carries no pricing the server would then have to second-guess, and it can never
 * hand the API a payload the API would reject.
 */

const KEY = 'shoba.guestCart'
const WISHLIST_KEY = 'shoba.guestWishlist'

beforeEach(() => {
  window.localStorage.clear()
  clearGuestState()
})

describe('what is persisted', () => {
  it('stores only identifiers, quantity and the chosen variant', () => {
    guestCart.add({ productId: 'p1', quantity: 2, selectedColor: 'Ivory', selectedSize: '5.5 m' })

    const raw = window.localStorage.getItem(KEY) as string

    expect(JSON.parse(raw)).toEqual([
      { productId: 'p1', quantity: 2, selectedColor: 'Ivory', selectedSize: '5.5 m' },
    ])
    // Nothing that the server owns, and could price differently.
    for (const forbidden of ['price', 'name', 'image', 'stock', 'subtotal', 'total']) {
      expect(raw).not.toContain(forbidden)
    }
  })
})

describe('add', () => {
  it('merges into the existing line for the same variant', () => {
    guestCart.add({ productId: 'p1', quantity: 1, selectedColor: 'Ivory', selectedSize: null })
    const lines = guestCart.add({ productId: 'p1', quantity: 2, selectedColor: 'Ivory', selectedSize: null })

    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(3)
  })

  it('keeps a different colour as a separate line, as the server would', () => {
    guestCart.add({ productId: 'p1', quantity: 1, selectedColor: 'Ivory' })
    const lines = guestCart.add({ productId: 'p1', quantity: 1, selectedColor: 'Maroon' })

    expect(lines).toHaveLength(2)
  })

  it('treats a missing variant and an explicit null as the same line', () => {
    guestCart.add({ productId: 'p1', quantity: 1 })
    const lines = guestCart.add({ productId: 'p1', quantity: 1, selectedColor: null, selectedSize: null })

    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(2)
  })

  it('clamps to the same maximum the API enforces', () => {
    const lines = guestCart.add({ productId: 'p1', quantity: 500 })

    expect(lines[0].quantity).toBe(99)
  })
})

describe('update and remove', () => {
  it('drops the line when the quantity reaches zero', () => {
    guestCart.add({ productId: 'p1', quantity: 2 })
    const lines = guestCart.update({ productId: 'p1', quantity: 0 })

    expect(lines).toEqual([])
  })

  it('leaves other lines untouched when one is removed', () => {
    guestCart.add({ productId: 'p1', quantity: 1, selectedColor: 'Ivory' })
    guestCart.add({ productId: 'p1', quantity: 1, selectedColor: 'Maroon' })
    guestCart.add({ productId: 'p2', quantity: 1 })

    const lines = guestCart.remove('p1', 'Ivory')

    expect(lines.map((line) => `${line.productId}:${line.selectedColor}`)).toEqual(['p1:Maroon', 'p2:null'])
  })

  it('reports the total quantity across every line', () => {
    guestCart.add({ productId: 'p1', quantity: 2 })
    guestCart.add({ productId: 'p2', quantity: 3 })

    expect(guestCart.count()).toBe(5)
  })
})

describe('corrupt or hostile storage', () => {
  it('survives a value that is not JSON', () => {
    window.localStorage.setItem(KEY, '{not json')

    expect(guestCart.read()).toEqual([])
  })

  it('survives a value that is not an array', () => {
    window.localStorage.setItem(KEY, '{"productId":"p1"}')

    expect(guestCart.read()).toEqual([])
  })

  it('discards lines with no product id or an unusable quantity', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        { productId: 'p1', quantity: 2 },
        { productId: '', quantity: 1 },
        { productId: 'p2', quantity: 0 },
        { productId: 'p3', quantity: -4 },
        { productId: 'p4', quantity: 'two' },
        'not an object',
        null,
      ]),
    )

    expect(guestCart.read()).toEqual([{ productId: 'p1', quantity: 2, selectedColor: null, selectedSize: null }])
  })

  it('normalises a fractional quantity to a whole number', () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ productId: 'p1', quantity: 2.9 }]))

    expect(guestCart.read()[0].quantity).toBe(2)
  })
})

describe('wishlist', () => {
  it('toggles a product on and back off', () => {
    expect(guestWishlist.toggle('p1')).toEqual(['p1'])
    expect(guestWishlist.toggle('p1')).toEqual([])
  })

  it('de-duplicates ids rather than counting a product twice', () => {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(['p1', 'p1', 'p2', '']))

    expect(guestWishlist.read()).toEqual(['p1', 'p2'])
  })
})

describe('merge payload', () => {
  it('sends nothing when the visitor has neither a bag nor a wishlist', () => {
    expect(readGuestState()).toBeUndefined()
  })

  it('sends only the half that is populated', () => {
    guestCart.add({ productId: 'p1', quantity: 1 })

    expect(readGuestState()).toEqual({
      cart: [{ productId: 'p1', quantity: 1, selectedColor: null, selectedSize: null }],
    })
  })

  it('sends the wishlist on its own when the bag is empty', () => {
    guestWishlist.toggle('p1')

    expect(readGuestState()).toEqual({ wishlist: ['p1'] })
  })

  it('is empty again once the local copies are cleared after a merge', () => {
    guestCart.add({ productId: 'p1', quantity: 1 })
    guestWishlist.toggle('p2')

    clearGuestState()

    expect(readGuestState()).toBeUndefined()
  })
})
