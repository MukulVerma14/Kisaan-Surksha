import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import mongoose from "mongoose";

dotenv.config();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ----------------- MongoDB Connection -----------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ WhatsApp Bot connected to MongoDB");

    // ----------------- Start server after DB is ready -----------------
    const PORT = process.env.PORT || 5002;
    app.use("/whatsapp", whatsappRoutes);
    app.listen(PORT, () => console.log(`✅ WhatsApp Bot running on port ${PORT}`));

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();
