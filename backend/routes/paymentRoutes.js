const express = require("express");
const Payment = require("../models/Payment");
const Job = require("../models/Job");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    const isCustomer = job.customer_id.toString() === req.user._id.toString();
    const isVendor =
      job.selected_vendor_id &&
      job.selected_vendor_id.toString() === req.user._id.toString();

    if (!isCustomer && !isVendor) {
      return res.status(403).json({ detail: "Access denied." });
    }

    const payment = await Payment.findOne({ job_id: job._id });
    if (!payment) {
      return res.status(404).json({ detail: "Payment not found." });
    }

    return res.json({
      id: payment._id.toString(),
      job_id: payment.job_id.toString(),
      customer_id: payment.customer_id.toString(),
      vendor_id: payment.vendor_id.toString(),
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      created_at: payment.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load payment." });
  }
});

router.post("/jobs/:jobId/mark-paid", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    if (job.status !== "completed") {
      return res.status(400).json({ detail: "Payment can only be marked after completion." });
    }

    const payment = await Payment.findOne({ job_id: job._id });
    if (!payment) {
      return res.status(404).json({ detail: "Payment not found." });
    }

    payment.status = "paid";
    await payment.save();

    return res.json({ message: "Payment marked as paid." });
  } catch (error) {
    return res.status(500).json({ detail: "Payment update failed." });
  }
});

router.get("/me/earnings", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const rows = await Payment.find({
      vendor_id: req.user._id,
      status: "paid",
    });

    const total = rows.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return res.json({
      paid_jobs_count: rows.length,
      total_paid_amount: total,
      method: "COD",
    });
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load earnings." });
  }
});

module.exports = router;