import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/run-ml", upload.single("image"), (req, res) => {
  const imagePath = path.resolve(req.file.path);
  const python = spawn("python", ["ml_model.py", imagePath]);

  let output = "";

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error("Python Error:", data.toString());
  });

  python.on("close", (code) => {
    if (res.headersSent) return; 
    console.log(`Python exited with code ${code}`);

    try {
      const result = JSON.parse(output.trim());
      res.json(result);
    } catch (err) {
      console.error("JSON Parse Error:", err, "Output:", output);
      res.status(500).json({ error: "Failed to parse ML output", raw: output });
    }
  });
});

export default router;
