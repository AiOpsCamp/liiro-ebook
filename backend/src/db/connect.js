"use strict";

const mongoose = require("mongoose");

const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27017/liiro_prod";
let isConnected = false;

async function connectDB(url) {
  let mongoUrl = url || process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || DEFAULT_MONGO_URL;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("✔️ Connected to Liiro Ebook MongoDB (liiro_prod)");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Hetzner MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Hetzner MongoDB disconnected");
  });

  try {
    const conn = await mongoose.connect(mongoUrl, {
      autoIndex: true,
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    return conn;
  } catch (err) {
    console.warn(`⚠️ Cluster hostname resolution (${mongoUrl}) failed locally. Connecting to Hetzner local instance on 127.0.0.1:27017...`);
    const conn = await mongoose.connect(LOCAL_FALLBACK_URL, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return conn;
  }
}

module.exports = connectDB;
