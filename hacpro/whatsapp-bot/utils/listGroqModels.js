import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("No API key found in GROQ_API_KEY");
  process.exit(1);
}

console.log("Fetching available Groq models...\n");

try {
  const response = await axios.get("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const models = response.data?.data || [];
  models
    .map((m) => m.id)
    .sort()
    .forEach((id) => console.log(`- ${id}`));
} catch (err) {
  console.error("Failed to list models:", err.response?.data || err.message);
  process.exit(1);
}
