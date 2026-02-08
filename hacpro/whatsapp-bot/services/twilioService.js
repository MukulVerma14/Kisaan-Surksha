import dotenv from "dotenv";
dotenv.config();   // must be at the top

import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendMessage = async (to, message) => {
  try {
    if (!to.startsWith("whatsapp:")) to = `whatsapp:${to}`;
    const response = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
    console.log("Message sent:", response.sid);
    return response;
  } catch (error) {
    console.error("Twilio sendMessage error:", error.message);
    throw error;
  }
};
