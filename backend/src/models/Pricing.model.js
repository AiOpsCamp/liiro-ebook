const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    subscriptionType: {
      type: String,
      enum: ["monthly", "3-months", "6-months", "yearly", "2-yearly", "lifetime"],
      required: true,
    },
    iapType: {
      type: String,
      enum: ["product", "subscription"],
      required: true,
    },
    pricingType: {
      type: String,
      enum: ["stripe", "playStore", "appStore"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      validate: {
        validator: function (v) {
          if (!this.discount.isAvailable) return true;
          return v > this.price;
        },
        message: "originalPrice must be > price when discount applies",
      },
      required: function () {
        return this.discount.isAvailable;
      },
    },
    currency: {
      type: String,
      match: /^[A-Z]{3}$/,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },

    // Stripe metadata
    stripeProductId: {
      type: String,
      required: function () {
        return this.pricingType === "stripe";
      },
    },
    stripePriceId: {
      type: String,
      required: function () {
        return this.pricingType === "stripe";
      },
    },

    // Google Play metadata
    playStore: {
      sku: {
        type: String,
        required: function () {
          return this.pricingType === "playStore";
        },
      },
      type: {
        type: String,
        enum: ["product", "subscription"],
        required: function () {
          return this.pricingType === "playStore";
        },
      },
      price: String,
      currency: String,
      billingPeriod: String,
      subscriptionOfferDetails: mongoose.Schema.Types.Mixed,
    },

    // Apple App Store metadata
    appStore: {
      sku: {
        type: String,
        required: function () {
          return this.pricingType === "appStore";
        },
      },
      type: {
        type: String,
        enum: ["product", "subscription"],
        required: function () {
          return this.pricingType === "appStore";
        },
      },
      displayPrice: String,
      currency: String,
      subscriptionPeriodUnit: String,
      originalProduct: mongoose.Schema.Types.Mixed,
    },

    discount: {
      isAvailable: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, min: 0, max: 100, default: 0 },
      validity: Date,
    },

    // Platform availability flags
    platform: {
      algocodecamp: { type: Boolean, default: false },
      lingoCamp: { type: Boolean, default: false },
      langoprep: { type: Boolean, default: false },
      langowords: { type: Boolean, default: false },
      langoread: { type: Boolean, default: false },
      languagePackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LanguagePack",
        required: function () {
          return (
            this.platform.lingoCamp ||
            this.platform.langoprep ||
            this.platform.langowords ||
            this.platform.langoread
          );
        },
      },
      languageName: {
        type: String,
        required: function () {
          return (
            this.platform.lingoCamp ||
            this.platform.langoprep ||
            this.platform.langowords ||
            this.platform.langoread
          );
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Indexes
pricingSchema.index({ pricingType: 1 });
pricingSchema.index({ "platform.languageName": 1 });

// Query helper to filter by platform
pricingSchema.query.byPlatform = function (platformKey) {
  return this.where({ [`platform.${platformKey}`]: true });
};

// Static method to find by platform
pricingSchema.statics.findByPlatform = function (platformKey) {
  return this.find().byPlatform(platformKey);
};

module.exports = mongoose.model("Pricing", pricingSchema);
