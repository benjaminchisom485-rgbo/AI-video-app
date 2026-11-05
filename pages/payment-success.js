import Head from 'next/head';
import Link from 'next/link';

export async function getServerSideProps({ query }) {
  const paymentReference = typeof query.paymentReference === 'string' ? query.paymentReference : null;

  if (!paymentReference) {
    return { props: { paymentReference: null, verification: null, issue: 'missing_reference' } };
  }

  try {
    const { verifyMonnifyPayment } = await import('../lib/monnify');
    const verification = await verifyMonnifyPayment(paymentReference);
    return { props: { paymentReference, verification, issue: null } };
  } catch (error) {
    const issue = error?.code === 'missing_configuration' ? 'configuration_missing' : 'verification_unavailable';
    return { props: { paymentReference, verification: null, issue } };
  }
}

export default function PaymentSuccessPage({ paymentReference, verification, issue }) {
  const isVerified = verification?.verified === true;

  return (
    <>
      <Head>
        <title>{isVerified ? 'Payment verified' : 'Payment status'} | AI Video Studio</title>
        <meta name="description" content="Check the status of your Monnify payment." />
        <meta name="theme-color" content="#080b09" />
      </Head>
      <main className="status-page">
        <section className={`status-card${isVerified ? ' status-card-success' : ''}`} aria-labelledby="payment-status-title">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">AV</span>
            <span>AI Video Studio</span>
          </Link>
          <p className="eyebrow">MONNIFY PAYMENT</p>
          <h1 id="payment-status-title">{isVerified ? 'Payment verified.' : 'Payment not confirmed yet.'}</h1>

          {isVerified ? (
            <>
              <p>Your {verification.plan.name} plan payment has been confirmed by Monnify.</p>
              <div className="summary-line status-summary">
                <span>{verification.plan.name} plan</span>
                <strong>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(verification.plan.price)}</strong>
              </div>
            </>
          ) : (
            <p>
              {issue === 'missing_reference'
                ? 'No payment reference was returned. You can choose a plan and try again.'
                : issue === 'configuration_missing'
                  ? 'Payment verification is not configured for this deployment yet.'
                  : issue === 'verification_unavailable'
                    ? 'We could not reach Monnify to verify this payment. Check again in a moment.'
                    : `Monnify reports the status as ${verification?.paymentStatus || 'pending'}. If you completed payment, check again shortly.`}
            </p>
          )}

          {paymentReference && !isVerified && (
            <p className="reference-line">Reference: <span>{paymentReference}</span></p>
          )}

          <div className="status-actions">
            {!isVerified && paymentReference && (
              <button className="button-secondary" type="button" onClick={() => window.location.reload()}>
                Check payment status again
              </button>
            )}
            <Link className="button-primary" href={isVerified ? '/' : '/plans'}>
              {isVerified ? 'Return to studio' : 'Back to plans'}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
