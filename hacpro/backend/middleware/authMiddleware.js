import jwt from "jsonwebtoken";
import Farmer from "../models/Farmer.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    const farmer = await Farmer.findById(decoded.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    req.user = { id: farmer._id, aadhar: farmer.aadhar, dob: farmer.dob };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
