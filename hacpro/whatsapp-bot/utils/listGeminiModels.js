import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API;

if (!apiKey) {
  console.error("No API key found in GEMINI_API_KEY or GEMINI_API");
  process.exit(1);
}

console.log("Fetching available Gemini models...\n");

// Try both v1 and v1beta endpoints
const endpoints = [
  "https://generativelanguage.googleapis.com/v1/models",
  "https://generativelanguage.googleapis.com/v1beta/models",
];

for (const baseUrl of endpoints) {
  try {
    const url = `${baseUrl}?key=${apiKey}`;
    console.log(`Trying ${baseUrl}...`);
    const response = await axios.get(url);
    
    if (response.data?.models) {
      console.log(`\n✅ Success! Found ${response.data.models.length} models:\n`);
      response.data.models.forEach((model) => {
        if (model.supportedGenerationMethods?.includes("generateContent")) {
          console.log(`  - ${model.name} (${model.displayName || "N/A"})`);
        }
      });
      break;
    }
  } catch (err) {
    if (err.response) {
      console.log(`  ❌ Error: ${err.response.data?.error?.message || err.message}`);
    } else {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }
}

