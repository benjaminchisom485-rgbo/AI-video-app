import { createMonnifyCheckout, MonnifyApiError } from '../../../../lib/monnify';

export const runtime = 'nodejs';

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Send a valid JSON checkout request.' }, { status: 400 });
  }

  try {
    const checkout = await createMonnifyCheckout({
      planId: input?.planId,
      name: input?.name,
      email: input?.email,
      origin: new URL(request.url).origin,
    });

    return Response.json(checkout);
  } catch (error) {
    if (error instanceof MonnifyApiError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return Response.json(
      { error: 'We could not start checkout. Please try again.' },
      { status: 502 },
    );
  }
}
