const mongoose = require("mongoose");

const jobImageSchema = new mongoose.Schema(
  {
    image_url: { type: String, required: true },
  },
  { _id: true }
);

const jobSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    selected_vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    service_type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    preferred_time: {
      type: String,
      default: null,
    },
    customer_budget: {
      type: Number,
      required: true,
      min: 1,
    },
    final_cost: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "picked_up",
        "in_repair",
        "repaired",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
      default: "open",
    },
    images: {
      type: [jobImageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);