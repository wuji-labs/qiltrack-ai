import { Langfuse } from "langfuse";

type LangfuseClient = ReturnType<typeof getClient>;

let cachedClient: LangfuseClient | null = null;

function getClient() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const host = process.env.LANGFUSE_HOST;
  // Note: sampling configuration is not supported in current Langfuse version
  // const samplingRate = Number(process.env.LANGFUSE_SAMPLING_RATE || "1");

  if (!publicKey || !secretKey || !host) return null;

  try {
    return new Langfuse({
      publicKey,
      secretKey,
      baseUrl: host,
      // sampling: isNaN(samplingRate) ? 1 : samplingRate, // Not supported
    });
  } catch (err) {
    console.warn("Langfuse init failed:", err);
    return null;
  }
}

export function getLangfuseClient() {
  if (cachedClient === undefined) {
    cachedClient = null;
  }
  if (cachedClient) return cachedClient;
  cachedClient = getClient();
  return cachedClient;
}
