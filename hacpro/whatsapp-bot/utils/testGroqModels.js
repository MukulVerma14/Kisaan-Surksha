import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("GROQ_API_KEY is not set");
  process.exit(1);
}

const models = [
  process.env.GROQ_MODEL,
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
].filter(Boolean);

console.log("Testing Groq models...\n");

for (const model of models) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: "Say hello in one short sentence." }],
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const text = response.data?.choices?.[0]?.message?.content?.trim();
    console.log(`✅ ${model}: ${text}`);
  } catch (err) {
    console.log(
      `❌ ${model}: ${err.response?.data?.error?.message || err.message}`
    );
  }
}
