import Head from 'next/head';
import PlanCheckout from '../components/plan-checkout';

export default function PlansPage() {
  return (
    <>
      <Head>
        <title>Plans | AI Video Studio</title>
        <meta name="description" content="Choose a video creation plan and continue to secure Monnify checkout." />
        <meta name="theme-color" content="#080b09" />
      </Head>
      <PlanCheckout />
    </>
  );
}
