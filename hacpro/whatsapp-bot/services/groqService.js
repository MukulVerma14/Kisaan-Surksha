import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

const getApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return apiKey;
};

const getModelCandidates = () => {
  const primary = process.env.GROQ_MODEL;
  if (primary) {
    return [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  }
  return FALLBACK_MODELS;
};

const chatCompletion = async (messages, options = {}) => {
  const apiKey = getApiKey();
  const models = options.models || getModelCandidates();
  let lastError;

  for (const model of models) {
    try {
      const response = await axios.post(
        GROQ_CHAT_URL,
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 800,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log(`✅ Groq response from ${model}`);
        return text;
      }
      throw new Error("Groq returned empty response");
    } catch (err) {
      lastError = err;
      const message =
        err?.response?.data?.error?.message || err?.message || "Unknown error";
      console.warn(`Groq model ${model} failed: ${message.substring(0, 160)}`);
    }
  }

  throw lastError || new Error("GROQ_API_FAILED");
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
    `Total Farm Area: ${profile.totalLandArea ? `${profile.totalLandArea} sq m` : "Not provided"}`,
  ];
  return lines.join("\n");
};

const FARMER_SYSTEM_PROMPT =
  "You are KisaanSuraksha Mitra, an agriculture support assistant for Indian farmers. Respond in friendly Hinglish (mix of Hindi and English) using simple words. Provide empathetic, practical advice referencing Indian farming context. Always add a brief reminder that final decisions should involve local agriculture officers or trusted experts. Keep answers within 6-8 sentences maximum.";

export const generateFarmerResponse = async (profile, history = [], question) => {
  const messages = [{ role: "system", content: FARMER_SYSTEM_PROMPT }];

  messages.push({
    role: "user",
    content: `Farmer profile information:\n${formatProfile(profile)}\n\nThe farmer will now ask a question. Please reply accordingly.`,
  });

  history.forEach((entry) => {
    if (!entry?.role || !entry?.text) return;
    messages.push({
      role: entry.role === "bot" ? "assistant" : "user",
      content: entry.text,
    });
  });

  messages.push({ role: "user", content: question });

  return chatCompletion(messages);
};

const getLanguageName = (code) => {
  const langMap = {
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    kn: "Kannada",
    mr: "Marathi",
    gu: "Gujarati",
    pa: "Punjabi",
    bn: "Bengali",
    or: "Odia",
    ml: "Malayalam",
    ur: "Urdu",
    en: "English",
  };
  return langMap[code?.toLowerCase()] || code || "the detected language";
};

export const generateResponse = async (
  userMessage,
  agroData = {},
  detectedLanguage = "en"
) => {
  const soilMoisture = Number(agroData?.soil_moisture);
  const soilTemp = agroData?.soil_temp;

  let soilCondition = "NORMAL";
  if (!Number.isNaN(soilMoisture)) {
    if (soilMoisture < 15) soilCondition = "DRY/CRITICAL";
    else if (soilMoisture > 35) soilCondition = "WET";
  }

  const languageName = getLanguageName(detectedLanguage);

  const systemInstruction =
    "You are KisaanSuraksha Bot, an expert Indian Agronomist. You respond to farmers in their native language ONLY. You NEVER use English words or code-switching unless the selected language is English. You use pure native vocabulary, proper script, and natural expressions that local farmers understand.";

  const userPrompt = [
    "You are KisaanSuraksha Bot, an expert Indian Agronomist helping smallholder farmers.",
    "",
    `User Query: ${userMessage}`,
    `Selected Language: ${detectedLanguage} (${languageName}) - farmer's preferred language`,
    "",
    `Soil Data: Moisture ${agroData?.soil_moisture ?? "unknown"}%, Temperature ${soilTemp ?? "unknown"}°C`,
    `Soil Condition: ${soilCondition}`,
    "",
    "CRITICAL LANGUAGE REQUIREMENTS:",
    `- You MUST respond ONLY in ${languageName} (${detectedLanguage})`,
    detectedLanguage?.toLowerCase() === "en"
      ? "- Use clear, simple English suitable for rural farmers"
      : "- DO NOT use ANY English words, phrases, or code-switching",
    "- Use ONLY pure native vocabulary and expressions",
    "- Write in the native script/alphabet for this language",
    "",
    "Agricultural Advice:",
    "- If soil moisture is below 15%, advise immediate irrigation",
    "- Provide practical, actionable farming advice",
    "- Use simple words that farmers understand",
    "- Reference Indian farming context and practices",
    "",
    "IMPORTANT: Keep your response concise and within 1200 characters for WhatsApp.",
    "",
    `Now respond to the farmer's query in ${languageName} ONLY:`,
  ].join("\n");

  try {
    return await chatCompletion([
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ]);
  } catch (err) {
    throw new Error("GROQ_API_FAILED");
  }
};
