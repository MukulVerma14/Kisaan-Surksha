
import express from "express";
import jwt from "jsonwebtoken";
import Farmer from "../models/Farmer.js";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";


const router = express.Router();

const ADMIN_ID = "admin123";
const ADMIN_PASS = "password123";

router.post("/login", (req, res) => {
  const { adminId, password } = req.body;

  if (adminId === ADMIN_ID && password === ADMIN_PASS) {
  
    const token = jwt.sign({ adminId }, "secretkey", { expiresIn: "1d" });

    return res.json({
      message: "Login successful",
      token,
    });
  }

  res.status(401).json({ message: "Invalid Admin ID or Password" });
});

router.get("/farmer/:aadhar", async (req, res) => {
  try {
    const aadharNumber = req.params.aadhar;
    console.log(`🔍 Searching for farmer with Aadhaar: ${aadharNumber}`);
    
    const farmer = await Farmer.findOne({ aadhar: aadharNumber });
    console.log(`📊 Farmer found:`, farmer ? "Yes" : "No");

    if (!farmer) {
      console.log(`❌ Farmer not found for Aadhaar: ${aadharNumber}`);
      return res.status(404).json({ message: "Farmer not found" });
    }

    // Ensure all fields are included, especially for multilingual data
    const farmerData = {
      _id: farmer._id,
      aadhar: farmer.aadhar,
      dob: farmer.dob,
      name: farmer.name || "",
      landReg: farmer.landReg || "",
      city: farmer.city || "",
      state: farmer.state || "",
      reason: farmer.reason || "",
      totalLandArea: farmer.totalLandArea ?? null,
      preferredLanguage: farmer.preferredLanguage || "en",
      images: farmer.images || [],
      droneImages: farmer.droneImages || [],
      pdfGenerated: farmer.pdfGenerated || false,
      pdfPath: farmer.pdfPath || "",
      createdAt: farmer.createdAt,
      updatedAt: farmer.updatedAt,
    };

    // Set proper content type for Unicode support
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(farmerData); 
  } catch (error) {
    console.error("Admin fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/stats", async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments({});
    const reportsProcessed = await Farmer.countDocuments({ pdfGenerated: true });
    const pendingReviews = totalFarmers - reportsProcessed;

    res.json({ totalFarmers, reportsProcessed, pendingReviews });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/mark-pdf-generated", async (req, res) => {
  try {
    const { aadhar } = req.body;
    if (!aadhar) return res.status(400).json({ message: "Aadhar is required" });

    const farmer = await Farmer.findOne({ aadhar });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    farmer.pdfGenerated = true;
    await farmer.save();

    res.json({ message: "Farmer report marked as generated" });
  } catch (err) {
    console.error("Error updating farmer pdf status:", err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
