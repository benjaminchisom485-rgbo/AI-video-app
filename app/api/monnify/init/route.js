export async function POST(req) {
  try {
    const { amount, email, name } = await req.json();
    
    const apiKey = process.env.MONNIFY_API_KEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const contractCode = process.env.MONNIFY_CONTRACT_CODE;
    const baseUrl = process.env.MONNIFY_BASE_URL || "https://api.monnify.com";

    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
    
    // Get access token
    const authRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` }
    });
    const authData = await authRes.json();
    const token = authData.responseBody?.accessToken;
    
    // Create payment link
    const paymentRes = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount || 1000,
        currencyCode: "NGN",
        paymentReference: `REF_${Date.now()}`,
        customerName: name || "Customer",
        customerEmail: email || "customer@email.com",
        contractCode: contractCode,
        paymentDescription: "AI Video Payment",
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://ai-video-app.vercel.app"}/payment-success`,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER"]
      })
    });
    
    const paymentData = await paymentRes.json();
    return new Response(JSON.stringify(paymentData), { status: 200 });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}