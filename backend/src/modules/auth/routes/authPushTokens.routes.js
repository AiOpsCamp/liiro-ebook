"use strict";

const router = require("express").Router();
const authMiddleware = require("../../../middlewares/authMiddleware.js");
const {
  upsertPushToken,
  revokePushToken,
  listMyPushTokens,
} = require("../controllers/pushTokens.controller.js");

router.use(authMiddleware);

router.post("/me/push-token", upsertPushToken);
router.post("/me/push-token/revoke", revokePushToken);
router.get("/me/push-tokens", listMyPushTokens);

module.exports = router;
