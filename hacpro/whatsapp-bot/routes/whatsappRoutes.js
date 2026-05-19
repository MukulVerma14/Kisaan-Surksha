import express from "express";
import { handleIncomingMessage } from "../controllers/whatsappController.js";
import { shouldProcessTwilioWebhook } from "../utils/twilioWebhook.js";

const router = express.Router();

router.post("/incoming", async (req, res) => {
  res.sendStatus(200);

  const data = req.body;
  const decision = shouldProcessTwilioWebhook(data);

  if (!decision.process) {
    console.log(
      `Skipping webhook (${decision.reason}): From=${data.From} To=${data.To} Body=${data.Body ?? "(empty)"}`
    );
    return;
  }

  console.log("Incoming webhook:");
  console.log("From:", data.From);
  console.log("To:", data.To);
  console.log("Body:", data.Body);

  try {
    await handleIncomingMessage(data);
  } catch (err) {
    console.error("Error in WhatsApp route:", err?.message || err);
  }
});

export default router;
