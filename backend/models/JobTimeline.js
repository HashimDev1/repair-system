const mongoose = require("mongoose");

const jobTimelineSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    changed_by_role: {
      type: String,
      enum: ["customer", "vendor", "system"],
      required: true,
    },
    note: {
      type: String,
      default: null,
    },
    changed_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("JobTimeline", jobTimelineSchema);