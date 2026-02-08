import express from "express";
import { handleIncomingMessage } from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/incoming", async (req, res) => {
  res.sendStatus(200); // respond immediately to Twilio

  try {
    await handleIncomingMessage(req.body);
  } catch (err) {
    console.error("Error in WhatsApp route:", err);
  }
});

export default router;
