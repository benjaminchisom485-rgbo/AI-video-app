import { MonnifyApiError, verifyMonnifyPayment } from '../../../../lib/monnify';

export const runtime = 'nodejs';

async function handleVerification(paymentReference) {
  try {
    const result = await verifyMonnifyPayment(paymentReference);
    return Response.json(result);
  } catch (error) {
    if (error instanceof MonnifyApiError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return Response.json(
      { error: 'We could not verify this payment. Please try again.' },
      { status: 502 },
    );
  }
}

export async function GET(request) {
  const paymentReference = new URL(request.url).searchParams.get('paymentReference');
  return handleVerification(paymentReference);
}

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Send a valid JSON verification request.' }, { status: 400 });
  }

  return handleVerification(input?.paymentReference);
}
