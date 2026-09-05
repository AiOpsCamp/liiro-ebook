"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/authJwt");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.delete("/account", authController.deleteAccount);

module.exports = router;
