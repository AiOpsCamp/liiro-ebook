const mongoose = require("mongoose");

const StripeCheckoutSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeCustomerId: { type: String, required: true, index: true },
    stripeCheckoutSessionId: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ["payment", "subscription"], required: true },
    priceId: { type: String, required: true },
    status: { type: String, default: "created" }, // created|completed|expired|canceled|failed
    createdAtStripe: { type: Number, default: null }, // unix seconds
    raw: { type: Object, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StripeCheckoutSession", StripeCheckoutSessionSchema);
