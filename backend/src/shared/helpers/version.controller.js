/**
 * Version Controller
 * Provides API version information and build metadata
 */

const packageJson = require("../../../package.json");
const _path = require("path");
const _fs = require("fs");

/**
 * Get version information
 * Returns package version, build info, and git metadata
 */
const getVersion = (req, res) => {
  try {
    const version = packageJson.version;
    const buildInfo = {
      version,
      name: packageJson.name,
      description: packageJson.description,
      timestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      gitCommit: process.env.GIT_COMMIT || "unknown",
      gitBranch: process.env.GIT_BRANCH || "unknown",
      buildNumber: process.env.BUILD_NUMBER || "unknown",
      nodeVersion: process.version,
      uptime: process.uptime(),
    };

    res.json({
      ok: true,
      ...buildInfo,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to get version information",
      message: error.message,
    });
  }
};

/**
 * Get simple version string
 * Returns just the version number
 */
const getVersionSimple = (req, res) => {
  try {
    res.json({
      version: packageJson.version,
    });
  } catch (error) {
    res.status(500).json({
      version: "unknown",
      error: error.message,
    });
  }
};

/**
 * Health check endpoint (already exists but version-aware)
 */
const getHealth = (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    version: packageJson.version,
    env: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getVersion,
  getVersionSimple,
  getHealth,
};
