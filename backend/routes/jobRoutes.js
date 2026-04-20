const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Job = require("../models/Job");
const JobTimeline = require("../models/JobTimeline");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `job-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const {
      service_type,
      description,
      address,
      preferred_time,
      customer_budget,
    } = req.body;

    if (!service_type || !description || !address || !customer_budget) {
      return res.status(400).json({ detail: "Missing required fields." });
    }

    const job = await Job.create({
      customer_id: req.user._id,
      service_type: service_type.trim(),
      description: description.trim(),
      address: address.trim(),
      preferred_time: preferred_time || null,
      customer_budget: Number(customer_budget),
      status: "open",
    });

    await JobTimeline.create({
      job_id: job._id,
      status: "open",
      changed_by_role: "customer",
      note: "Job posted by customer.",
    });

    return res.status(201).json({
      id: job._id.toString(),
      customer_id: job.customer_id.toString(),
      selected_vendor_id: job.selected_vendor_id,
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
    });
  } catch (error) {
    return res.status(500).json({ detail: "Failed to create job." });
  }
});

router.post(
  "/:id/images",
  authMiddleware,
  requireRole("customer"),
  upload.array("files", 10),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ detail: "Job not found." });
      }

      if (job.customer_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ detail: "Access denied." });
      }

      if (job.status !== "open") {
        return res.status(400).json({ detail: "Images can only be uploaded while job is open." });
      }

      const newImages = (req.files || []).map((file) => ({
        image_url: `/uploads/${file.filename}`,
      }));

      job.images.push(...newImages);
      await job.save();

      return res.json(job.images);
    } catch (error) {
      return res.status(500).json({ detail: "Failed to upload job images." });
    }
  }
);

router.get("/me", authMiddleware, async (req, res) => {
  try {
    let jobs = [];

    if (req.user.role === "customer") {
      jobs = await Job.find({ customer_id: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === "vendor") {
      jobs = await Job.find({ selected_vendor_id: req.user._id }).sort({ createdAt: -1 });
    }

    const data = jobs.map((job) => ({
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
    }));

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load jobs." });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    const isCustomerOwner = job.customer_id.toString() === req.user._id.toString();
    const isSelectedVendor =
      job.selected_vendor_id &&
      job.selected_vendor_id.toString() === req.user._id.toString();

    if (!isCustomerOwner && !isSelectedVendor) {
      return res.status(403).json({ detail: "Access denied." });
    }

    return res.json({
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
    });
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load job." });
  }
});

router.get("/:id/timeline", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    const isCustomerOwner = job.customer_id.toString() === req.user._id.toString();
    const isSelectedVendor =
      job.selected_vendor_id &&
      job.selected_vendor_id.toString() === req.user._id.toString();

    if (!isCustomerOwner && !isSelectedVendor) {
      return res.status(403).json({ detail: "Access denied." });
    }

    const timeline = await JobTimeline.find({ job_id: job._id }).sort({ changed_at: 1 });

    return res.json(
      timeline.map((t) => ({
        id: t._id.toString(),
        job_id: t.job_id.toString(),
        status: t.status,
        changed_by_role: t.changed_by_role,
        note: t.note,
        changed_at: t.changed_at,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load timeline." });
  }
});

router.post("/:id/cancel", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    if (job.status !== "open") {
      return res.status(400).json({ detail: "Only open jobs can be cancelled." });
    }

    job.status = "cancelled";
    await job.save();

    await JobTimeline.create({
      job_id: job._id,
      status: "cancelled",
      changed_by_role: "customer",
      note: "Job cancelled by customer.",
    });

    return res.json({ message: "Job cancelled successfully." });
  } catch (error) {
    return res.status(500).json({ detail: "Cancel failed." });
  }
});
router.post("/:id/status", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const { new_status, note } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ detail: "Job not found." });
    }

    if (!job.selected_vendor_id || job.selected_vendor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    const NEXT_STATUS = {
      assigned: ["picked_up"],
      picked_up: ["in_repair"],
      in_repair: ["repaired"],
      repaired: ["ready_for_pickup"],
      ready_for_pickup: ["completed"],
    };

    const allowed = NEXT_STATUS[job.status] || [];
    if (!allowed.includes(new_status)) {
      return res.status(400).json({ detail: "Invalid status transition." });
    }

    job.status = new_status;
    await job.save();

    await JobTimeline.create({
      job_id: job._id,
      status: new_status,
      changed_by_role: "vendor",
      note: note || null,
    });

    return res.json({ message: "Status updated successfully." });
  } catch (error) {
    return res.status(500).json({ detail: "Status update failed." });
  }
});

module.exports = router;