const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposed_cost: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "selected", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job_id: 1, vendor_id: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);