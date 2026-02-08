import express from "express";
import Farmer from "../models/Farmer.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/get", authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    res.json({
      name: farmer.name || "",
      landReg: farmer.landReg || "",
      city: farmer.city || "",
      state: farmer.state || "",
      reason: farmer.reason || "",
      images: farmer.images || [],
    });
  } catch (err) {
    console.error("Dashboard GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { name, landReg, city, state, reason, images } = req.body;

    const farmer = await Farmer.findById(req.user.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    if (name) farmer.name = name;
    if (landReg) farmer.landReg = landReg;
    if (city) farmer.city = city;
    if (state) farmer.state = state;
    if (reason) farmer.reason = reason;
    if (images && images.length > 0) farmer.images = images;

    await farmer.save();

    res.json({ message: "Dashboard updated successfully", farmer });
  } catch (err) {
    console.error("Dashboard UPDATE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
