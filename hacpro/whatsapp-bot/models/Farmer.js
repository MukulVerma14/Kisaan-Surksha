// backend/models/Farmer.js
import mongoose from "mongoose";

const FarmerSchema = new mongoose.Schema({
  aadhar: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String },
  landReg: { type: String },
  city: { type: String },
  state: { type: String },
  reason: { type: String },
  images: [{ type: String }],
    droneImages: [String], 
});

const Farmer = mongoose.model("Farmer", FarmerSchema);

export default Farmer;
