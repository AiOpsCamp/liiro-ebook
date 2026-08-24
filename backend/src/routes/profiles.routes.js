"use strict";

const express = require("express");
const router = express.Router();
const profilesController = require("../controllers/profiles.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware.optionalAuth, profilesController.getProfiles);
router.post("/", authMiddleware.optionalAuth, profilesController.createProfile);
router.post("/switch", authMiddleware.optionalAuth, profilesController.switchProfile);
router.post("/verify-pin", authMiddleware.optionalAuth, profilesController.verifyParentalPin);
router.delete("/:profileId", authMiddleware.optionalAuth, profilesController.deleteProfile);

module.exports = router;
