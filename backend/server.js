"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/db/connect");

const storiesRoutes = require("./src/routes/stories.routes");
const ebookMetadataRoutes = require("./src/routes/ebookMetadata.routes");
const authRoutes = require("./src/modules/auth/routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 5012;

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: "Too many requests from this IP" },
});
app.use("/api/", apiLimiter);

// Health Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "liiro-ebook-backend",
    version: "1.0.0",
    database: "liiro_prod",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "liiro-ebook-backend",
    version: "1.0.0",
    database: "liiro_prod",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1/stories", storiesRoutes);
app.use("/api/v1/ebook-metadata", ebookMetadataRoutes);
app.use("/api/v1/auth", authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=========================================================================`);
      console.log(`🚀 Liiro Ebook Backend Microservice live on http://localhost:${PORT}`);
      console.log(`📂 Database: liiro_prod`);
      console.log(`=========================================================================`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
