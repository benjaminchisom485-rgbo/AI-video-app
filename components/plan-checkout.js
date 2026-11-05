import { useState } from 'react';
import Link from 'next/link';
import { PLANS } from '../lib/plans';

const formatNaira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function isMonnifyCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'monnify.com' || url.hostname.endsWith('.monnify.com'))
    );
  } catch {
    return false;
  }
}

export default function PlanCheckout() {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedPlan || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/monnify/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          name: customerName,
          email: customerEmail,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Checkout could not be started. Please try again.');
      }
      if (!isMonnifyCheckoutUrl(result?.checkoutUrl)) {
        throw new Error('Monnify returned an invalid checkout link. Please try again.');
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Checkout could not be started. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-header">
          <Link className="brand" href="/" aria-label="AI Video Studio home">
            <span className="brand-mark" aria-hidden="true">AV</span>
            <span>AI Video Studio</span>
          </Link>
          <span className="secure-label">
            <span className="secure-indicator" aria-hidden="true" />
            Monnify secure checkout
          </span>
        </header>

        <section className="checkout-intro" aria-labelledby="checkout-title">
          <p className="eyebrow">SUBSCRIPTIONS</p>
          <h1 id="checkout-title">Choose your creative time.</h1>
          <p>Pick a plan, add your receipt details, and complete payment securely with Monnify.</p>
        </section>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <fieldset className="plan-fieldset">
            <legend>Choose a plan</legend>
            <p className="field-hint" id="plan-help">Select one option. The amount is fixed by the server.</p>
            <div className="plan-grid" aria-describedby="plan-help">
              {PLANS.map((plan) => (
                <button
                  className={`plan-card${selectedPlanId === plan.id ? ' is-selected' : ''}`}
                  type="button"
                  key={plan.id}
                  aria-pressed={selectedPlanId === plan.id}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setMessage(null);
                  }}
                >
                  <span className="plan-name">{plan.name}</span>
                  <strong className="plan-price">{formatNaira.format(plan.price)}</strong>
                  <span className="plan-duration">{plan.days} {plan.days === 1 ? 'day' : 'days'}</span>
                  <span className="plan-description">{plan.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="checkout-details">
            <section className="customer-fields" aria-labelledby="receipt-heading">
              <div>
                <p className="eyebrow">PAYMENT DETAILS</p>
                <h2 id="receipt-heading">Where should we send your receipt?</h2>
              </div>
              <div className="form-field">
                <label htmlFor="customer-name">Full name</label>
                <input
                  id="customer-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="form-field">
                <label htmlFor="customer-email">Email address</label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <p className="field-hint">Your name and email are sent to Monnify to identify the transaction.</p>
            </section>

            <aside className="order-summary" aria-labelledby="summary-heading">
              <p className="eyebrow">ORDER SUMMARY</p>
              <h2 id="summary-heading">Your plan</h2>
              <div className="summary-line">
                <span>{selectedPlan?.name || 'Select a plan'}</span>
                <strong>{selectedPlan ? formatNaira.format(selectedPlan.price) : '—'}</strong>
              </div>
              {selectedPlan && (
                <p className="summary-duration">Access period: {selectedPlan.days} {selectedPlan.days === 1 ? 'day' : 'days'}</p>
              )}
              <button className="button-primary checkout-submit" type="submit" disabled={!selectedPlan || isSubmitting}>
                {isSubmitting ? 'Opening secure checkout...' : 'Continue to Monnify'}
              </button>
              <p className="payment-note">Card and account-transfer details are entered on Monnify. We never handle your card details.</p>
            </aside>
          </div>

          {message && (
            <p className="form-message form-message-error" role="alert">
              {message.text}
            </p>
          )}
        </form>

        <footer className="checkout-footer">
          Payment confirmation is checked with Monnify before this page reports a successful payment.
        </footer>
      </div>
    </main>
  );
}
