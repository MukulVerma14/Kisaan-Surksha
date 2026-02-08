import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";





// Routes
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";


const app = express();
const PORT = 5000;

// DB Connection
connectDB();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminAuthRoutes);
app.use("/api/admin", mlRoutes);
app.use("/api/admin", adminAuthRoutes);



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
