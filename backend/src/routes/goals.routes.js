const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goal.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware.optionalAuth);

// Get current year goal
router.get("/current", goalController.getCurrentGoal);

// Update goal target (number of books)
router.patch("/target", goalController.updateTarget);

// Log completed book
router.post("/log-completed", goalController.logCompletedBook);

module.exports = router;
