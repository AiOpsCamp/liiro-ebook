"use strict";

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/db/connect");

const storiesRoutes = require("./src/routes/stories.routes");
const ebookMetadataRoutes = require("./src/routes/ebookMetadata.routes");
const authRoutes = require("./src/modules/auth/routes/auth.routes");
const notificationRoutes = require("./src/routes/notifications.routes");

const app = express();
const PORT = process.env.PORT || 5012;

// Trust reverse proxy ingress (K3s Traefik / Nginx)
app.set("trust proxy", 1);

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  })
);

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
app.get("/health", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      status: "healthy",
      service: "liiro-ebook-backend",
      version: "1.0.0",
      database: "liiro_prod",
      dbConnected: isDbConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {
    res.status(500).json({ status: "unhealthy", message: "Database connection failed" });
  }
});

const opdsRoutes = require("./src/routes/opds.routes");
const billingRoutes = require("./src/routes/billing.routes");

// API Routes
app.use("/api/v1/stories", storiesRoutes);
app.use("/api/v1/metadata", ebookMetadataRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/opds", opdsRoutes);
app.use("/api/v1/opds", opdsRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Connect to Database & Start Server
const mongoose = require("mongoose");
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Liiro Ebook Backend listening on port ${PORT}`);
  });
});
