const express = require("express");
const Rating = require("../models/Rating");
const Job = require("../models/Job");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/jobs/:jobId", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const { stars, review_text } = req.body;

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    if (job.status !== "completed") {
      return res.status(400).json({ detail: "Rating is only allowed after completion." });
    }

    if (!job.selected_vendor_id) {
      return res.status(400).json({ detail: "No vendor assigned to this job." });
    }

    const existing = await Rating.findOne({ job_id: job._id });
    if (existing) {
      return res.status(400).json({ detail: "Rating already submitted for this job." });
    }

    const rating = await Rating.create({
      job_id: job._id,
      customer_id: req.user._id,
      vendor_id: job.selected_vendor_id,
      stars: Number(stars),
      review_text: review_text || null,
    });

    return res.status(201).json({
      id: rating._id.toString(),
      job_id: rating.job_id.toString(),
      customer_id: rating.customer_id.toString(),
      vendor_id: rating.vendor_id.toString(),
      stars: rating.stars,
      review_text: rating.review_text,
      created_at: rating.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Rating failed." });
  }
});

router.get("/vendors/:vendorId", authMiddleware, async (req, res) => {
  try {
    const rows = await Rating.find({ vendor_id: req.params.vendorId }).sort({ createdAt: -1 });

    return res.json(
      rows.map((r) => ({
        rating_id: r._id.toString(),
        job_id: r.job_id.toString(),
        customer_id: r.customer_id.toString(),
        vendor_id: r.vendor_id.toString(),
        customer_name: "Customer",
        stars: r.stars,
        review_text: r.review_text,
        created_at: r.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load ratings." });
  }
});

router.get("/me", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const rows = await Rating.find({ vendor_id: req.user._id }).sort({ createdAt: -1 });

    return res.json(
      rows.map((r) => ({
        rating_id: r._id.toString(),
        job_id: r.job_id.toString(),
        customer_id: r.customer_id.toString(),
        vendor_id: r.vendor_id.toString(),
        customer_name: "Customer",
        stars: r.stars,
        review_text: r.review_text,
        created_at: r.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load ratings." });
  }
});

module.exports = router;