import express from "express";
import Farmer from "../models/Farmer.js";

const router = express.Router();


router.post("/dashboard/update", async (req, res) => {
  const { aadhar, dob, name, landReg, city, state, reason, images } = req.body;

  if (!aadhar || !dob) {
    return res.status(400).json({ message: "Aadhar and DOB are required" });
  }

  try {
    const farmer = await Farmer.findOne({ aadhar, dob });

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    
    if (name) farmer.name = name;
    if (landReg) farmer.landReg = landReg;
    if (city) farmer.city = city;
    if (state) farmer.state = state;
    if (reason) farmer.reason = reason;
    if (images && images.length > 0) farmer.images = images;

    await farmer.save();

    return res.json({ message: "Farmer data updated successfully", farmer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
