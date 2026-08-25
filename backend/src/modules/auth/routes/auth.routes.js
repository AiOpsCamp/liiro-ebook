const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({ success: false, error: err.message || err.publicMessage || "Auth error", code: err.code });
  });

// Middlewares
const authMiddleware = require("../../../middlewares/authMiddleware");

// Tight limiter for unauthenticated credential endpoints (login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please try again in a minute." },
  skipSuccessfulRequests: false,
});

// Legacy controllers (keep for backward compatibility)
const authController = require("../controllers/auth.controller");
const googleAuthController = require("../controllers/googleAuth.controller");

// App controllers
const userController = require("../../user/controllers/user.controller");
const badgesController = require("../../user/controllers/badges.controller");

// New Firebase-SDK-first controller (ID token -> backend JWT)
const firebaseAuthController = require("../controllers/auth.firebase.controller");

/* =========================================================
   Legacy Firebase REST auth (backend receives passwords)
   (Keep temporarily; plan to remove once frontend fully uses Firebase SDK)
========================================================= */
router.post("/fb-email-register", authLimiter, asyncHandler(authController.fbEmailRegister));
router.post("/fb-email-login", authLimiter, asyncHandler(authController.fbEmailLogin));
router.post("/fb-email-forgot", authLimiter, authController.fbEmailForgotPassword);
router.post(
  "/fb-email-reset-password",
  authLimiter,
  authController.fbEmailResetPasswordWithOobCode
);

// Back-compat: requires Firebase idToken from client
router.post("/fb-resend-verification", authLimiter, authController.fbResendVerification);

// Recommended legacy helper: uses backend JWT (no Firebase token required).
// Rate-limited to prevent verification-email spam even from an authenticated user.
router.post(
  "/resend-verification",
  authLimiter,
  authMiddleware,
  authController.resendVerificationFromJwt
);

// Legacy: change password (reauths with Firebase REST)
router.post("/fb-change-password", authMiddleware, authController.fbChangePassword);

/* =========================================================
   Legacy token-based endpoints (older “firebase-register/login”)
   (Keep temporarily; superseded by POST /firebase)
========================================================= */
router.post("/firebase-register", authLimiter, authController.firebaseRegister);
router.post("/firebase-login", authLimiter, authController.firebaseLogin);

/* =========================================================
   Legacy Google auth endpoint
   (Keep temporarily; superseded by POST /firebase)
========================================================= */
router.post("/google-auth", authLimiter, googleAuthController.googleAuth);

/* =========================================================
   Legacy refresh endpoint
========================================================= */
router.post("/refresh-token", authLimiter, authController.getRefreshToken);

/* =========================================================
   Protected user APIs (existing)
========================================================= */
router.get("/get-user-info", authMiddleware, userController.getUserInfo);
router.get("/me", authMiddleware, userController.getUserInfo);
router.get("/v2/me", authMiddleware, userController.getUserInfoClean);
router.patch("/me", authMiddleware, userController.updateMe);

// legacy single token endpoint
router.post("/notification-token", authMiddleware, userController.updateNotificationToken);

/* =========================================================
   Badges (existing)
========================================================= */
router.get("/user-badges", authMiddleware, badgesController.getUserBadges);
router.get("/all-badges", authMiddleware, badgesController.getAllBadges);

/* =========================================================
   Account lifecycle (existing legacy)
========================================================= */
router.post("/logout", authMiddleware, authController.logout);
router.post("/logout-all", authMiddleware, authController.logoutAll);
router.delete("/me", authMiddleware, userController.deleteMe);
// Unauthenticated by design (restores a soft-deleted account) — rate-limit to
// prevent abuse / account-state probing.
router.post("/restore-account", authLimiter, userController.restoreAccount);

/* =========================================================
   NEW Firebase-SDK-first endpoints
   Frontend: Firebase SDK -> getIdToken() -> POST /firebase
========================================================= */
router.post("/firebase", authLimiter, asyncHandler(firebaseAuthController.firebaseExchange));
router.post("/firebase/refresh", authLimiter, asyncHandler(firebaseAuthController.refresh));
router.post("/firebase/logout", asyncHandler(firebaseAuthController.logout));

// Use your existing authMiddleware (recommended) to avoid 2 JWT middlewares
router.post("/firebase/logout-all", authMiddleware, asyncHandler(firebaseAuthController.logoutAll));
router.get("/firebase/me", authMiddleware, asyncHandler(firebaseAuthController.me));

module.exports = router;
