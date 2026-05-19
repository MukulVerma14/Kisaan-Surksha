/** Normalize whatsapp:+123... for reliable comparisons */
export const normalizeWhatsAppId = (value = "") =>
  String(value).trim().toLowerCase();

/** Bot's Twilio WhatsApp sender (supports either env var name) */
export const getBotWhatsAppNumber = () =>
  normalizeWhatsAppId(
    process.env.TWILIO_PHONE_NUMBER ||
      process.env.TWILIO_WHATSAPP_NUMBER ||
      ""
  );

/**
 * Twilio posts delivery/read status and outbound echoes to the same webhook.
 * Those must not run the registration/chat flow.
 */
export const shouldProcessTwilioWebhook = (data = {}) => {
  const from = normalizeWhatsAppId(data.From);
  const body = (data.Body || "").trim();
  const numMedia = parseInt(data.NumMedia || "0", 10);
  const bot = getBotWhatsAppNumber();

  // Get the status (if it exists) and lowercase it
  const status = (data.MessageStatus || data.SmsStatus || "").toLowerCase();

  // If there is a status, but it's NOT "received", it's a delivery/read receipt
  if (status && status !== "received") {
    return { process: false, reason: "status_callback" };
  }

  // Skip empty messages (unless they have media/voice notes)
  if (!body && numMedia === 0) {
    return { process: false, reason: "empty_body" };
  }

  // Prevent the bot from talking to itself (echoes)
  if (bot && from === bot) {
    return { process: false, reason: "from_bot_number" };
  }

  return { process: true };
};

export const isBotWhatsAppNumber = (address) => {
  const bot = getBotWhatsAppNumber();
  return Boolean(bot && normalizeWhatsAppId(address) === bot);
};
