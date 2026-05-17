import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.join(__dirname, "..");

router.post("/run-ml", upload.array("images", 10), (req, res) => {
  const totalLandArea = parseFloat(req.body.total_land_area);

  if (!Number.isFinite(totalLandArea) || totalLandArea <= 0) {
    return res.status(400).json({
      error: "total_land_area is required and must be a positive number",
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one drone image is required" });
  }

  const imagePaths = req.files.map((file) => path.resolve(file.path));
  const payload = JSON.stringify({
    total_land_area: totalLandArea,
    image_paths: imagePaths,
  });

  const python = spawn("python", ["ml_model.py"], { cwd: backendDir });

  let output = "";
  let stderrOutput = "";

  python.stdin.write(payload);
  python.stdin.end();

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    stderrOutput += data.toString();
    console.error("Python Error:", data.toString());
  });

  python.on("close", (code) => {
    if (res.headersSent) return;
    console.log(`Python exited with code ${code}`);

    if (code !== 0) {
      const detail = stderrOutput.trim() || "Python process failed";
      return res.status(500).json({
        error: "ML model failed to run",
        detail,
      });
    }

    try {
      const result = JSON.parse(output.trim());
      if (result.error) {
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (err) {
      console.error("JSON Parse Error:", err, "Output:", output, "Stderr:", stderrOutput);
      res.status(500).json({
        error: "Failed to parse ML output",
        detail: stderrOutput.trim() || output.trim() || "No output from Python",
      });
    }
  });
});

export default router;
