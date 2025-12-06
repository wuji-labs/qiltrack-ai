import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY,
});

export async function heliTest() {
  const response = await client.chat.completions.create({
    model: process.env.HELICONE_MODEL || "gpt-5.1",
    messages: [{ role: "user", content: "Hello, world!" }],
  });
  return response;
}
