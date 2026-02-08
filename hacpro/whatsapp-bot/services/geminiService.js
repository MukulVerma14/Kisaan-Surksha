import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return apiKey;
};

const buildClient = () => {
  return new GoogleGenerativeAI(getApiKey());
};

const formatProfile = (profile = {}) => {
  const lines = [
    `Name: ${profile.name || "Unknown"}`,
    `Aadhaar: ${profile.aadhar || "Unknown"}`,
    `DOB: ${profile.dob || "Unknown"}`,
    `Land Registration: ${profile.landReg || "Unknown"}`,
    `City/Village: ${profile.city || "Unknown"}`,
    `State: ${profile.state || "Unknown"}`,
    `Recent Issue: ${profile.reason || profile.issue || "Not provided"}`,
  ];
  return lines.join("\n");
};

const createModel = (client, modelName) =>
  client.getGenerativeModel({
    model: modelName,
    systemInstruction:
      "You are KisaanSuraksha Mitra, an agriculture support assistant for Indian farmers. Respond in friendly Hinglish (mix of Hindi and English) using simple words. Provide empathetic, practical advice referencing Indian farming context. Always add a brief reminder that final decisions should involve local agriculture officers or trusted experts. Keep answers within 6-8 sentences maximum.",
  });

const attemptGenerate = async (model, contents) => {
  const result = await model.generateContent({ contents });
  const text = result.response?.text?.().trim();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  return text;
};

export const generateFarmerResponse = async (profile, history = [], question) => {
  const systemInstruction =
    "You are KisaanSuraksha Mitra, an agriculture support assistant for Indian farmers. Respond in friendly Hinglish (mix of Hindi and English) using simple words. Provide empathetic, practical advice referencing Indian farming context. Always add a brief reminder that final decisions should involve local agriculture officers or trusted experts. Keep answers within 6-8 sentences maximum.";

  // Build conversation context
  const profileText = `Farmer profile information:\n${formatProfile(profile)}\n\n`;
  const historyText = history
    .map((entry) => {
      if (!entry?.role || !entry?.text) return "";
      const prefix = entry.role === "bot" ? "Assistant: " : "Farmer: ";
      return `${prefix}${entry.text}`;
    })
    .join("\n\n");
  
  const fullPrompt = `${profileText}${historyText ? historyText + "\n\n" : ""}Farmer: ${question}\n\nAssistant:`;

  // Try models in order - use Gemini 2.x models that are available
  const preferredModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-001",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
  ];

  // First try SDK approach
  const client = buildClient();
  for (const modelName of preferredModels) {
    try {
      const formattedHistory = [];
      history.forEach((entry) => {
        if (!entry?.role || !entry?.text) return;
        const role = entry.role === "bot" ? "model" : "user";
        formattedHistory.push({ role, parts: [{ text: entry.text }] });
      });

      const contents = [
        {
          role: "user",
          parts: [
            {
              text: `Farmer profile information:\n${formatProfile(profile)}\n\nThe farmer will now ask a question. Please reply accordingly.`,
            },
          ],
        },
        ...formattedHistory,
        { role: "user", parts: [{ text: question }] },
      ];

      const model = createModel(client, modelName);
      return await attemptGenerate(model, contents);
    } catch (err) {
      console.warn(`SDK: Model ${modelName} failed: ${err.message?.substring(0, 100)}`);
      // Continue to next model or REST API
    }
  }

  // If SDK fails, try REST API with v1 endpoint
  console.log("Trying REST API fallback...");
  for (const modelName of preferredModels) {
    try {
      // Try v1 API first (more stable)
      const apiKey = getApiKey();
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        console.log(`✅ REST API success with ${modelName}`);
        return text;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`REST v1: Model ${modelName} not found, trying v1beta...`);
        // Try v1beta as last resort
        try {
          const apiKey = getApiKey();
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const payload = {
            contents: [{ parts: [{ text: fullPrompt }] }],
          };
          const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" },
          });
          const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            console.log(`✅ REST v1beta success with ${modelName}`);
            return text;
          }
        } catch (err2) {
          console.warn(`REST v1beta: Model ${modelName} failed: ${err2.response?.data?.error?.message || err2.message}`);
        }
      } else {
        console.warn(`REST API: Model ${modelName} error: ${err.response?.data?.error?.message || err.message}`);
      }
    }
  }

  throw new Error("Unable to generate response - all models and API endpoints failed. Please check your API key has access to Gemini models.");
};

