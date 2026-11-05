import { randomUUID } from 'node:crypto';
import { getPlanById } from './plans.js';

const allowedMonnifyHosts = new Set(['api.monnify.com', 'sandbox.monnify.com']);

export class MonnifyApiError extends Error {
  constructor(message, status = 502, code = 'monnify_error') {
    super(message);
    this.name = 'MonnifyApiError';
    this.status = status;
    this.code = code;
  }
}

function getConfiguration() {
  const apiKey = process.env.MONNIFY_API_KEY?.trim();
  const secretKey = process.env.MONNIFY_SECRET_KEY?.trim();
  const contractCode = process.env.MONNIFY_CONTRACT_CODE?.trim();

  if (!apiKey || !secretKey || !contractCode) {
    throw new MonnifyApiError(
      'Monnify checkout is not configured for this deployment.',
      503,
      'missing_configuration',
    );
  }

  let baseUrl;
  try {
    baseUrl = new URL(process.env.MONNIFY_BASE_URL?.trim() || 'https://api.monnify.com');
  } catch {
    throw new MonnifyApiError('The Monnify API URL is invalid.', 500, 'invalid_configuration');
  }

  if (
    baseUrl.protocol !== 'https:' ||
    !allowedMonnifyHosts.has(baseUrl.hostname) ||
    baseUrl.pathname !== '/' ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new MonnifyApiError('The Monnify API URL is not allowed.', 500, 'invalid_configuration');
  }

  return {
    apiKey,
    secretKey,
    contractCode,
    baseUrl: baseUrl.origin,
  };
}

async function requestMonnify(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new MonnifyApiError('Monnify did not respond in time. Please try again.', 504, 'timeout');
    }
    throw new MonnifyApiError('Could not reach Monnify. Please try again.', 502, 'gateway_unavailable');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

async function getAccessToken(configuration) {
  const credentials = Buffer.from(`${configuration.apiKey}:${configuration.secretKey}`).toString('base64');
  const { response, data } = await requestMonnify(
    `${configuration.baseUrl}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    },
  );
  const accessToken = data?.responseBody?.accessToken;

  if (!response.ok || data?.requestSuccessful !== true || typeof accessToken !== 'string') {
    throw new MonnifyApiError(
      'Monnify authentication failed. Check the project credentials in Vercel.',
      502,
      'authentication_failed',
    );
  }

  return accessToken;
}

function isAllowedCheckoutUrl(value) {
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

function isSafeOrigin(value) {
  try {
    const origin = new URL(value);
    if (origin.protocol === 'https:') return true;
    return origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  } catch {
    return false;
  }
}

export async function createMonnifyCheckout({ planId, name, email, origin }) {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new MonnifyApiError('Choose a valid subscription plan.', 400, 'invalid_plan');
  }

  const customerName = typeof name === 'string' ? name.trim() : '';
  const customerEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (customerName.length < 2 || customerName.length > 80) {
    throw new MonnifyApiError('Enter a name between 2 and 80 characters.', 400, 'invalid_name');
  }
  if (
    customerEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
  ) {
    throw new MonnifyApiError('Enter a valid email address.', 400, 'invalid_email');
  }
  if (!isSafeOrigin(origin)) {
    throw new MonnifyApiError('The checkout return address is invalid.', 400, 'invalid_origin');
  }

  const configuration = getConfiguration();
  const accessToken = await getAccessToken(configuration);
  const paymentReference = `aivideo_${plan.id}_${randomUUID()}`;
  const redirectUrl = new URL('/payment-success', origin);
  redirectUrl.searchParams.set('paymentReference', paymentReference);

  const { response, data } = await requestMonnify(
    `${configuration.baseUrl}/api/v1/merchant/transactions/init-transaction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: plan.price,
        currencyCode: 'NGN',
        paymentReference,
        customerName,
        customerEmail,
        contractCode: configuration.contractCode,
        paymentDescription: `AI Video Studio ${plan.name} plan`,
        redirectUrl: redirectUrl.toString(),
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
      }),
    },
  );

  const checkoutUrl = data?.responseBody?.checkoutUrl;
  if (
    !response.ok ||
    data?.requestSuccessful !== true ||
    typeof checkoutUrl !== 'string' ||
    !isAllowedCheckoutUrl(checkoutUrl)
  ) {
    throw new MonnifyApiError(
      'Monnify could not create a checkout session. Please try again.',
      502,
      'checkout_initialization_failed',
    );
  }

  return { checkoutUrl, paymentReference };
}

export async function verifyMonnifyPayment(paymentReference) {
  if (typeof paymentReference !== 'string') {
    throw new MonnifyApiError('A payment reference is required.', 400, 'invalid_reference');
  }

  const match = /^aivideo_(daily|weekly|monthly|yearly)_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(paymentReference);
  if (!match) {
    throw new MonnifyApiError('The payment reference is invalid.', 400, 'invalid_reference');
  }

  const plan = getPlanById(match[1].toLowerCase());
  const configuration = getConfiguration();
  const accessToken = await getAccessToken(configuration);
  const queryUrl = new URL('/api/v1/merchant/transactions/query', configuration.baseUrl);
  queryUrl.searchParams.set('paymentReference', paymentReference);

  const { response, data } = await requestMonnify(queryUrl.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const transaction = data?.responseBody;

  if (!response.ok || data?.requestSuccessful !== true || !transaction) {
    throw new MonnifyApiError(
      'Monnify could not verify this payment yet. Please try again.',
      502,
      'verification_failed',
    );
  }

  const paymentStatus = String(transaction.paymentStatus || 'UNKNOWN').toUpperCase();
  const amountPaid = Number(transaction.amountPaid);
  const currencyCode = String(transaction.currencyCode || '').toUpperCase();
  const verified = paymentStatus === 'PAID' && amountPaid === plan.price && currencyCode === 'NGN';

  return {
    paymentReference,
    paymentStatus,
    verified,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      days: plan.days,
    },
  };
}
