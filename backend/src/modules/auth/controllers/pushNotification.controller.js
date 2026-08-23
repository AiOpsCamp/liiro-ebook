"use strict";

const axios = require("axios");
const User = require("../../../models/User.model");
const NotificationCampaign = require("../../../models/NotificationCampaign.model");

function buildUserQueryFromCampaign(campaign) {
  const q = {};

  if (campaign.onlyActiveUsers) {
    q.accountStatus = "active";
    q.isSuspended = { $ne: true };
    q.deletedAt = null;
  }

  if (Array.isArray(campaign.roles) && campaign.roles.length) {
    q.role = { $in: campaign.roles };
  }

  return q;
}

async function collectAllTokens(userQuery) {
  const cursor = User.find(userQuery, { pushTokens: 1, notificationToken: 1 }).lean().cursor();

  const tokensSet = new Set();
  for await (const u of cursor) {
    if (Array.isArray(u.pushTokens)) {
      for (const pt of u.pushTokens) {
        if (pt?.token) tokensSet.add(pt.token);
      }
    }
    if (u.notificationToken) tokensSet.add(u.notificationToken);
  }

  return Array.from(tokensSet);
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * POST /api/v1/auth/admin/campaigns
 * Create campaign (draft by default)
 */
async function createCampaign(req, res) {
  try {
    const {
      name,
      title,
      body,
      data = {},
      sound = "default",
      ttl,
      priority = "high",
      channelId,
      onlyActiveUsers = false,
      roles = [],
      scheduledAt, // optional
    } = req.body || {};

    if (!name || !title || !body) {
      return res.status(400).json({ success: false, message: "name, title, body are required" });
    }

    const campaign = await NotificationCampaign.create({
      name,
      title,
      body,
      data,
      sound,
      ttl,
      priority,
      channelId,
      onlyActiveUsers,
      roles,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/admin/campaigns/:id/send
 * Sends a campaign NOW (even if draft)
 */
async function sendCampaignNow(req, res) {
  try {
    const { id } = req.params;
    const { dryRun = false } = req.body || {};

    const campaign = await NotificationCampaign.findById(id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // prevent double send
    if (campaign.status === "sending") {
      return res.status(409).json({ success: false, message: "Campaign is already sending" });
    }
    if (campaign.status === "sent" && !dryRun) {
      return res.status(409).json({ success: false, message: "Campaign already sent" });
    }

    campaign.status = "sending";
    campaign.lastError = undefined;
    await campaign.save();

    const userQuery = buildUserQueryFromCampaign(campaign);
    const tokens = await collectAllTokens(userQuery);

    if (!tokens.length) {
      campaign.status = "failed";
      campaign.lastError = "No push tokens found for target audience";
      campaign.stats = { totalTokens: 0, chunks: 0, expoErrors: 0 };
      await campaign.save();

      return res.json({
        success: true,
        message: "No tokens found (nothing sent).",
        data: { campaign },
      });
    }

    const chunkSize = 100;
    const chunks = chunkArray(tokens, chunkSize);

    const expoUrl = process.env.EXPO_PUSH_URL || "https://exp.host/--/api/v2/push/send";

    let expoErrors = 0;
    const tickets = [];

    for (const chunk of chunks) {
      const messages = chunk.map((to) => ({
        to,
        title: campaign.title,
        body: campaign.body,
        data: campaign.data,
        sound: campaign.sound,
        ttl: campaign.ttl,
        priority: campaign.priority,
        channelId: campaign.channelId,
      }));

      if (dryRun) {
        tickets.push({ dryRun: true, messagesCount: messages.length });
        continue;
      }

      try {
        const { data: expoResp } = await axios.post(expoUrl, messages, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        });
        tickets.push(expoResp);
      } catch (err) {
        expoErrors++;
        tickets.push({ error: true, message: err.message, details: err?.response?.data });
      }
    }

    campaign.stats = {
      totalTokens: tokens.length,
      chunks: chunks.length,
      expoErrors,
    };

    if (dryRun) {
      campaign.status = "draft"; // keep unchanged for dry run
    } else if (expoErrors > 0) {
      campaign.status = "failed";
      campaign.sentAt = new Date();
      campaign.lastError = "One or more Expo requests failed";
    } else {
      campaign.status = "sent";
      campaign.sentAt = new Date();
    }

    await campaign.save();

    return res.json({
      success: true,
      message: dryRun ? "Dry run completed" : "Campaign send attempted",
      data: {
        campaign,
        tickets,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createCampaign,
  sendCampaignNow,
};
