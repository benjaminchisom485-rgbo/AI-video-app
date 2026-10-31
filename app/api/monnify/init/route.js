import crypto from "crypto";

export async function POST(req) {
  // Monnify init logic will go here
  return new Response(JSON.stringify({ status: "Monnify init ready" }), { status: 200 });
}
