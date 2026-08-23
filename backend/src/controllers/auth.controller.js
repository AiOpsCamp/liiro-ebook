"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const JWT_SECRET = process.env.JWT_SECRET || "liiro_ebook_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = "30d";

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/v1/auth/register
 * Register new user
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const user = await User.create({
      username: username || email.split("@")[0],
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error("Error in register:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/**
 * POST /api/v1/auth/login
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error("Error in login:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = {
  register,
  login,
  getMe,
};
