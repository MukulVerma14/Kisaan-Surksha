import express from "express";
import Farmer from "../models/Farmer.js";
import jwt from "jsonwebtoken";

const router = express.Router();
let generatedOTP = null;


router.post("/signup/send-otp", (req, res) => {
  const { aadhar, dob } = req.body;
  if (!aadhar || !dob) return res.status(400).json({ message: "Aadhar and DOB are required" });

  generatedOTP = Math.floor(1000 + Math.random() * 9000);
  console.log("Generated OTP (backend):", generatedOTP);

  return res.json({ message: "OTP sent successfully", otp: generatedOTP });
});

router.post("/signup/verify-otp", async (req, res) => {
  const { aadhar, dob, otp } = req.body;
  if (!aadhar || !dob || !otp) return res.status(400).json({ message: "All fields are required" });

  if (parseInt(otp) !== generatedOTP) return res.status(400).json({ message: "Invalid OTP" });

  try {
    const existingUser = await Farmer.findOne({ aadhar });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newFarmer = new Farmer({ aadhar, dob });
    await newFarmer.save();

    generatedOTP = null;
    return res.json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { aadhar, dob } = req.body;

  try {
    const farmer = await Farmer.findOne({ aadhar, dob });
    if (!farmer) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: farmer._id, aadhar: farmer.aadhar, dob: farmer.dob },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
