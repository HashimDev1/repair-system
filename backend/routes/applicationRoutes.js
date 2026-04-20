const express = require("express");
const Application = require("../models/Application");
const Job = require("../models/Job");
const JobTimeline = require("../models/JobTimeline");
const Payment = require("../models/Payment");
const Rating = require("../models/Rating");
const User = require("../models/User");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

async function getVendorAvgRating(vendorId) {
  const rows = await Rating.find({ vendor_id: vendorId });
  if (!rows.length) return 0;
  const avg = rows.reduce((sum, r) => sum + Number(r.stars || 0), 0) / rows.length;
  return Number(avg.toFixed(1));
}

router.post("/jobs/:jobId", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const { proposed_cost, message } = req.body;

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.status !== "open") {
      return res.status(400).json({ detail: "You can only apply to open jobs." });
    }

    if (!proposed_cost || Number(proposed_cost) < 1) {
      return res.status(400).json({ detail: "Valid proposed cost is required." });
    }

    if (Number(proposed_cost) > Number(job.customer_budget)) {
      return res.status(400).json({ detail: "Offer must be within customer budget." });
    }

    const existing = await Application.findOne({
      job_id: job._id,
      vendor_id: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ detail: "You have already applied to this job." });
    }

    const app = await Application.create({
      job_id: job._id,
      vendor_id: req.user._id,
      proposed_cost: Number(proposed_cost),
      message: message || null,
      status: "pending",
    });

    return res.status(201).json({
      id: app._id.toString(),
      job_id: app.job_id.toString(),
      vendor_id: app.vendor_id.toString(),
      proposed_cost: app.proposed_cost,
      message: app.message,
      status: app.status,
      created_at: app.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Apply failed." });
  }
});

router.get("/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    const apps = await Application.find({ job_id: job._id }).sort({ createdAt: -1 });

    const result = [];
    for (const a of apps) {
      const vendor = await User.findById(a.vendor_id).select("name profile_image_url shop_image_url");
      const vendorAvg = await getVendorAvgRating(a.vendor_id);

      result.push({
        id: a._id.toString(),
        job_id: a.job_id.toString(),
        vendor_id: a.vendor_id.toString(),
        vendor_name: vendor?.name || "Vendor",
        vendor_profile_image_url: vendor?.profile_image_url || null,
        vendor_shop_image_url: vendor?.shop_image_url || null,
        vendor_avg_rating: vendorAvg,
        proposed_cost: a.proposed_cost,
        message: a.message,
        status: a.status,
        created_at: a.createdAt,
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load applications." });
  }
});

router.post("/jobs/:jobId/select", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const { application_id } = req.body;

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    if (job.status !== "open") {
      return res.status(400).json({ detail: "Vendor can only be selected for open jobs." });
    }

    const selectedApp = await Application.findById(application_id);
    if (!selectedApp || selectedApp.job_id.toString() !== job._id.toString()) {
      return res.status(404).json({ detail: "Application not found." });
    }

    job.selected_vendor_id = selectedApp.vendor_id;
    job.final_cost = selectedApp.proposed_cost;
    job.status = "assigned";
    await job.save();

    await Application.updateMany(
      { job_id: job._id, _id: { $ne: selectedApp._id } },
      { $set: { status: "rejected" } }
    );

    selectedApp.status = "selected";
    await selectedApp.save();

    const existingPayment = await Payment.findOne({ job_id: job._id });
    if (!existingPayment) {
      await Payment.create({
        job_id: job._id,
        customer_id: job.customer_id,
        vendor_id: selectedApp.vendor_id,
        amount: selectedApp.proposed_cost,
        method: "COD",
        status: "pending",
      });
    }

    await JobTimeline.create({
      job_id: job._id,
      status: "assigned",
      changed_by_role: "customer",
      note: "Vendor selected by customer.",
    });

    return res.json({ message: "Vendor selected successfully." });
  } catch (error) {
    return res.status(500).json({ detail: "Selection failed." });
  }
});

module.exports = router;