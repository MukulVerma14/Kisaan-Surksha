import dotenv from "dotenv";
dotenv.config();

import twilio from "twilio";
import { normalizeWhatsAppId } from "../utils/twilioWebhook.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MAX_MESSAGE_LENGTH = 1600;

const getTwilioFromNumber = () =>
  process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;

const formatWhatsAppAddress = (value) => {
  if (!value) return value;
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
};

const splitMessage = (message) => {
  if (message.length <= MAX_MESSAGE_LENGTH) {
    return [message];
  }

  const chunks = [];
  let remaining = message;

  while (remaining.length > MAX_MESSAGE_LENGTH) {
    let splitIndex = MAX_MESSAGE_LENGTH;
    const lastPeriod = remaining.lastIndexOf(".", MAX_MESSAGE_LENGTH);
    const lastExclamation = remaining.lastIndexOf("!", MAX_MESSAGE_LENGTH);
    const lastQuestion = remaining.lastIndexOf("?", MAX_MESSAGE_LENGTH);
    const lastNewline = remaining.lastIndexOf("\n", MAX_MESSAGE_LENGTH);

    const bestSplit = Math.max(
      lastPeriod,
      lastExclamation,
      lastQuestion,
      lastNewline
    );

    if (bestSplit > MAX_MESSAGE_LENGTH * 0.7) {
      splitIndex = bestSplit + 1;
    } else {
      const lastSpace = remaining.lastIndexOf(" ", MAX_MESSAGE_LENGTH);
      if (lastSpace > MAX_MESSAGE_LENGTH * 0.7) {
        splitIndex = lastSpace + 1;
      }
    }

    chunks.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
};

export const sendMessage = async (to, message) => {
  const fromNumber = getTwilioFromNumber();
  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER or TWILIO_WHATSAPP_NUMBER is not set");
  }

  const toAddress = formatWhatsAppAddress(to);
  const fromAddress = formatWhatsAppAddress(fromNumber);

  if (normalizeWhatsAppId(toAddress) === normalizeWhatsAppId(fromAddress)) {
    console.warn("Skipping send: To and From are the same", toAddress);
    return null;
  }

  try {
    const chunks = splitMessage(message);

    if (chunks.length > 1) {
      console.log(`📨 Message exceeds limit, splitting into ${chunks.length} parts`);
    }

    const responses = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partIndicator =
        chunks.length > 1 ? `[${i + 1}/${chunks.length}]\n\n` : "";
      const messageToSend = partIndicator + chunk;

      const response = await client.messages.create({
        from: fromAddress,
        to: toAddress,
        body: messageToSend,
      });

      console.log(`Message sent (part ${i + 1}/${chunks.length}):`, response.sid);
      responses.push(response);

      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return responses[0];
  } catch (error) {
    const code = error?.code;
    if (code === 63038) {
      console.error(
        "Twilio daily sandbox message limit reached (50/day). Try again tomorrow or upgrade Twilio."
      );
    } else {
      console.error("Twilio sendMessage error:", error.message);
    }
    throw error;
  }
};

