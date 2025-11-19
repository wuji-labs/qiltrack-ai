/* eslint-disable @typescript-eslint/no-require-imports */
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  try {
    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Say hello to Investor AI.",
    });

    console.log("输出：", res.output_text);
  } catch (err) {
    console.error("调用出错：", err);
  }
}

run();
