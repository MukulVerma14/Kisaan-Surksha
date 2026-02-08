import express from "express";
import Farmer from "../models/Farmer.js";

const router = express.Router();

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


router.get("/stats", async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const reportsProcessed = await Farmer.countDocuments({ pdfGenerated: true });
    const pendingReviews = totalFarmers - reportsProcessed;

    res.json({
      totalFarmers,
      reportsProcessed,
      pendingReviews,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
