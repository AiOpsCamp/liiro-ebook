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

const { logger, httpLogger } = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 5012;

// Trust reverse proxy ingress (K3s Traefik / Nginx)
app.set("trust proxy", 1);

// Structured HTTP Request Logging
app.use(httpLogger);

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

// Raw body parser specifically for Stripe Webhook signature verification
app.use("/api/v1/billing/webhook/stripe", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// User-Aware & IP Rate Limiting (Prevents shared NAT/WiFi false positives)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    return req.headers["x-guest-id"] || req.headers["authorization"] || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded. Please try again later." },
});
app.use("/api/", apiLimiter);

// Health & System APM Observability Endpoint
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const dbPingStart = Date.now();
    let dbLatencyMs = 0;
    if (isDbConnected && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - dbPingStart;
    }

    const memUsage = process.memoryUsage();

    res.status(200).json({
      status: isDbConnected ? "healthy" : "degraded",
      service: "liiro-ebook-backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        name: "liiro_prod",
        connected: isDbConnected,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round((memUsage.rss / 1024 / 1024) * 10) / 10,
        heapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMb: Math.round((memUsage.heapTotal / 1024 / 1024) * 10) / 10,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Health check encountered error");
    res.status(500).json({ status: "unhealthy", message: "Health check error", error: err.message });
  }
});

// Interactive Swagger / OpenAPI 3.0 Documentation UI
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/docs/swaggerSpec");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/v1/docs/spec.json", (req, res) => res.json(swaggerSpec));

const opdsRoutes = require("./src/routes/opds.routes");
const billingRoutes = require("./src/routes/billing.routes");
const profilesRoutes = require("./src/routes/profiles.routes");
const activityRoutes = require("./src/routes/activity.routes");
const reelsRoutes = require("./src/routes/reels.routes");
const quotesRoutes = require("./src/routes/quotes.routes");
const collectionsRoutes = require("./src/routes/collections.routes");
const goalsRoutes = require("./src/routes/goals.routes");
const adminRoutes = require("./src/routes/admin.routes");

// API Routes
app.use("/api/v1/stories", storiesRoutes);
app.use("/api/v1/metadata", ebookMetadataRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user/account", authRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/profiles", profilesRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/user", activityRoutes);
app.use("/api/v1/reels", reelsRoutes);
app.use("/api/v1/quotes", quotesRoutes);
app.use("/api/v1/collections", collectionsRoutes);
app.use("/api/v1/goals", goalsRoutes);
app.use("/api/v1/user/goals", goalsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/opds", opdsRoutes);
app.use("/api/v1/opds", opdsRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) {
    console.error("Unhandled Server Error:", err);
  }
  res.status(status).json({
    success: false,
    message: err.message || err.publicMessage || "Internal Server Error",
    code: err.code,
  });
});

// Connect to Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Liiro Ebook Backend listening on port ${PORT}`);
  });
});
