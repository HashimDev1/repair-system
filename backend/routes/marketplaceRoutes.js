const express = require("express");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/jobs", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const openJobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });

    const myApps = await Application.find({ vendor_id: req.user._id }).select("job_id");
    const appliedJobIds = new Set(myApps.map((a) => a.job_id.toString()));

    const filtered = openJobs.filter((j) => !appliedJobIds.has(j._id.toString()));

    return res.json(
      filtered.map((job) => ({
        id: job._id.toString(),
        customer_id: job.customer_id.toString(),
        selected_vendor_id: job.selected_vendor_id ? job.selected_vendor_id.toString() : null,
        service_type: job.service_type,
        description: job.description,
        address: job.address,
        preferred_time: job.preferred_time,
        customer_budget: job.customer_budget,
        final_cost: job.final_cost,
        status: job.status,
        images: job.images,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load marketplace jobs." });
  }
});

module.exports = router;