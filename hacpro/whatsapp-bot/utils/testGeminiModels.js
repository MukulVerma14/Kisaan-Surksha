import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
if (!apiKey) {
  console.error("No API key found");
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);

// Test Gemini 2.x model names
const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-001",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

console.log("Testing available Gemini models...\n");

for (const modelName of modelsToTest) {
  try {
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello");
    const text = result.response?.text();
    console.log(`✅ ${modelName} - WORKS!`);
    console.log(`   Response: ${text?.substring(0, 50)}...\n`);
    break; // Stop at first working model
  } catch (err) {
    console.log(`❌ ${modelName} - ${err.message?.substring(0, 80)}\n`);
  }
}

