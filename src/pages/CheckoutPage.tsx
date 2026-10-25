import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useCheckout, usePricedCart } from '../hooks/useCommerce'
import { HeritageImage } from '../components/HeritageImage'
import { ProductVisualPlaceholder } from '../components/ProductVisualPlaceholder'
import type { PaymentMethod } from '../types/api'

const paymentMethods: { id: PaymentMethod; label: string; detail: string }[] = [
  { id: 'upi', label: 'UPI', detail: 'Google Pay, PhonePe, BHIM' },
  { id: 'card', label: 'Card', detail: 'Visa, Mastercard, RuPay' },
  { id: 'cod', label: 'Pay on delivery', detail: 'A small handling fee applies' },
]

const states = ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal']

export function CheckoutPage() {
  const { user } = useAuth()
  const { items, cartCount } = useCart()
  const navigate = useNavigate()

  const [payment, setPayment] = useState<PaymentMethod>('upi')
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const checkout = useCheckout()

  // Only an account can own an order, so this screen sits behind the customer
  // guard and the bag is always the server's.
  const priced = usePricedCart({ shippingId: shippingId ?? undefined, paymentMethod: payment }, items.length > 0)
  const shippingOptions = useMemo(() => priced.data?.shippingOptions ?? [], [priced.data])
  const cart = priced.data?.cart

  // Land on the first offered delivery option as soon as the list arrives.
  useEffect(() => {
    if (shippingOptions.length === 0 || shippingOptions.some((option) => option.id === shippingId)) return
    setShippingId(shippingOptions[0].id)
  }, [shippingOptions, shippingId])

  const selectedOption = shippingOptions.find((option) => option.id === shippingId) ?? null
  // Server arithmetic: never recompute totals in the browser, only display them.
  const subtotal = cart?.subtotal ?? 0
  const shipping = cart?.shippingCost ?? 0
  const handling = cart?.handlingFee ?? 0
  const total = cart?.total ?? 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedOption) {
      setError('Choose a delivery method to continue.')
      return
    }

    const form = new FormData(event.currentTarget)
    setError(null)

    checkout
      .mutateAsync({
        shippingName: String(form.get('name') ?? ''),
        shippingEmail: String(form.get('email') ?? ''),
        shippingPhone: String(form.get('phone') ?? ''),
        shippingAddress: String(form.get('address') ?? ''),
        shippingCity: String(form.get('city') ?? ''),
        shippingState: String(form.get('state') ?? '') || undefined,
        shippingPincode: String(form.get('pincode') ?? ''),
        shippingMethod: selectedOption.id,
        paymentMethod: payment,
        note: String(form.get('note') ?? '') || undefined,
      })
      .then((response) => {
        navigate(`/store/orders?placed=${encodeURIComponent(response.order.orderNumber)}`)
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'We could not place the order. Please try again.')
      })
  }

  if (items.length === 0) {
    return <div className="empty-page"><div className="empty-page__mark">SC</div><p className="eyebrow">Checkout</p><h1>Your bag is empty.</h1><p>Add something beautiful before continuing to checkout.</p><Link to="/store/shop" className="button button--dark">Explore the collection</Link></div>
  }

  return (
    <div className="checkout-page">
      <section className="container checkout-heading">
        <Link to="/store/cart" className="back-link">← Back to bag</Link>
        <div><p className="eyebrow">A considered final step</p><h1>Checkout</h1></div>
        <span className="checkout-heading__secure">⌁ Secure checkout</span>
      </section>

      <form className="container checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card__heading"><span>01</span><div><h2>Contact details</h2><p>Where should we send your order note?</p></div></div>
            <div className="form-grid">
              <label>Full name<input required name="name" placeholder="Your name" defaultValue={user?.name ?? ''} /></label>
              <label>Email address<input required type="email" name="email" placeholder="you@example.com" defaultValue={user?.email ?? ''} /></label>
              <label>Phone number<input required name="phone" placeholder="+91 98765 43210" defaultValue={user?.phone ?? ''} /></label>
              <label>City<input required name="city" placeholder="Bengaluru" defaultValue={user?.city ?? ''} /></label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card__heading"><span>02</span><div><h2>Delivery address</h2><p>We currently deliver across India.</p></div></div>
            <div className="form-grid">
              <label className="form-grid__full">Address<input required name="address" placeholder="Flat, house, street" /></label>
              <label>State<select name="state" defaultValue=""><option value="">Select state</option>{states.map((state) => <option key={state}>{state}</option>)}</select></label>
              <label>Pincode<input required name="pincode" inputMode="numeric" placeholder="560001" /></label>
              <label className="form-grid__full">Order note<textarea name="note" rows={3} placeholder="Anything we should know about the delivery?" /></label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card__heading"><span>03</span><div><h2>Delivery method</h2><p>Choose a pace that suits you.</p></div></div>
            {shippingOptions.length === 0 ? (
              <p className="checkout-card__loading">Loading available delivery methods…</p>
            ) : (
              <div className="option-list">
                {shippingOptions.map((option) => (
                  <label key={option.id} className={`choice-card ${shippingId === option.id ? 'is-selected' : ''}`}>
                    <input type="radio" name="delivery" value={option.id} checked={shippingId === option.id} onChange={() => setShippingId(option.id)} />
                    <span className="choice-card__check" />
                    <span><strong>{option.label}</strong><small>{option.description}</small></span>
                    <b>{option.cost === 0 ? 'Complimentary' : formatCurrency(option.cost)}</b>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="checkout-card">
            <div className="checkout-card__heading"><span>04</span><div><h2>Payment</h2><p>How would you like to pay?</p></div></div>
            <div className="option-list">
              {paymentMethods.map((method) => (
                <label key={method.id} className={`choice-card ${payment === method.id ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value={method.id} checked={payment === method.id} onChange={() => setPayment(method.id)} />
                  <span className="choice-card__check" />
                  <span><strong>{method.label}</strong><small>{method.detail}</small></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary__heading"><h2>Your selection</h2><span>{cartCount} pieces</span></div>
          <div className="checkout-summary__items">
            {items.map((item) => (
              <div className="checkout-summary__item" key={item.key}>
                {item.imageUrl
                  ? <HeritageImage src={item.imageUrl} alt={item.name} loading="lazy" />
                  : <ProductVisualPlaceholder tone={item.tone} name={item.name} />}
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.selectedColor || item.selectedSize ? [item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') : 'Standard'} · Qty {item.quantity}</span>
                </div>
                <b>{formatCurrency(item.lineTotal)}</b>
              </div>
            ))}
          </div>

          <div className="checkout-summary__totals">
            <div><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div><span>Delivery</span><span>{shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}</span></div>
            {handling > 0 ? <div><span>Handling</span><span>{formatCurrency(handling)}</span></div> : null}
            <div className="checkout-summary__grand"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <button type="submit" className="button button--dark button--full" disabled={checkout.isPending || !selectedOption}>
            {checkout.isPending ? 'Placing your order…' : 'Place order'} <span>↗</span>
          </button>

          <p className="checkout-summary__foot">By placing your order, you agree to our terms. Delivery and taxes are calculated by the server at the time you order.</p>
        </aside>
      </form>
    </div>
  )
}
