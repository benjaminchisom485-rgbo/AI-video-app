export async function POST(req) {
  const body = await req.json();
  console.log("Monnify webhook:", body);
  return new Response("OK", { status: 200 });
}
