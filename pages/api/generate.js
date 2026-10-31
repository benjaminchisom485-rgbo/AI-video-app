import { experimental_generateVideo } from "ai";

const MODEL_ID = "google/veo-3.1-fast-generate-001";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 2;
const requestsByClient = new Map();

function getClientKey(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || "unknown-client";
}

function checkRateLimit(clientKey) {
  const now = Date.now();
  const currentWindow = requestsByClient.get(clientKey);

  if (!currentWindow || currentWindow.resetAt <= now) {
    requestsByClient.set(clientKey, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return 0;
  }

  if (currentWindow.count >= MAX_REQUESTS_PER_WINDOW) {
    return Math.max(1, Math.ceil((currentWindow.resetAt - now) / 1000));
  }

  currentWindow.count += 1;
  return 0;
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "8kb" },
    responseLimit: false,
  },
  maxDuration: 300,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return response.status(403).json({ error: "Cross-origin requests are not allowed." });
      }
    } catch {
      return response.status(403).json({ error: "Invalid request origin." });
    }
  }

  const prompt = typeof request.body?.prompt === "string" ? request.body.prompt.trim() : "";
  const aspectRatio = request.body?.aspectRatio;

  if (prompt.length < 8 || prompt.length > 600) {
    return response.status(400).json({ error: "Prompt must be between 8 and 600 characters." });
  }

  if (aspectRatio !== "16:9" && aspectRatio !== "9:16") {
    return response.status(400).json({ error: "Choose a supported video format." });
  }

  const retryAfter = checkRateLimit(getClientKey(request));
  if (retryAfter > 0) {
    response.setHeader("Retry-After", String(retryAfter));
    return response.status(429).json({
      error: `Please wait ${retryAfter} seconds before generating another video.`,
    });
  }

  try {
    const { video } = await experimental_generateVideo({
      model: MODEL_ID,
      prompt,
      aspectRatio,
    });

    const mediaType = video.mediaType.startsWith("video/") ? video.mediaType : "video/mp4";
    response.statusCode = 200;
    response.setHeader("Content-Type", mediaType);
    response.setHeader("Content-Length", String(video.uint8Array.byteLength));
    response.setHeader("Content-Disposition", "inline; filename=framework-ai-video.mp4");
    response.setHeader("Cache-Control", "private, no-store, max-age=0");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.write(video.uint8Array);
    return response.end();
  } catch (error) {
    console.error(
      "[v0] Video generation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return response.status(502).json({
      error: "Video generation is temporarily unavailable. Please try again.",
    });
  }
}
