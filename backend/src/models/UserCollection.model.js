const mongoose = require("mongoose");

const UserCollectionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    systemType: {
      type: String,
      enum: ["currently-reading", "want-to-read", "favorites", "custom"],
      default: "custom"
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: "bookmark"
    },
    color: {
      type: String,
      default: "#38BDF8"
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story"
      }
    ]
  },
  {
    timestamps: true
  }
);

UserCollectionSchema.index({ userId: 1, slug: 1 }, { unique: true });
UserCollectionSchema.index({ userId: 1, isSystem: 1 });

module.exports = mongoose.model("UserCollection", UserCollectionSchema, "usercollections");
