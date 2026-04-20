const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const Rating = require("../models/Rating");
const VendorService = require("../models/VendorService");
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
    cb(null, `vendor-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/:vendorId", authMiddleware, async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId).select("-password");
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ detail: "Vendor not found." });
    }

    return res.json({
      id: vendor._id.toString(),
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      phone: vendor.phone || null,
      city_area: vendor.city_area || null,
      profile_image_url: vendor.profile_image_url || null,
      shop_image_url: vendor.shop_image_url || null,
      created_at: vendor.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load vendor." });
  }
});

router.put("/me", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const { phone, city_area } = req.body;

    const vendor = await User.findById(req.user._id);
    if (!vendor) {
      return res.status(404).json({ detail: "Vendor not found." });
    }

    vendor.phone = phone || null;
    vendor.city_area = city_area || null;
    await vendor.save();

    return res.json({
      id: vendor._id.toString(),
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      phone: vendor.phone,
      city_area: vendor.city_area,
      profile_image_url: vendor.profile_image_url || null,
      shop_image_url: vendor.shop_image_url || null,
      created_at: vendor.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Profile update failed." });
  }
});

router.post(
  "/me/upload/profile-image",
  authMiddleware,
  requireRole("vendor"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ detail: "No file uploaded." });
      }

      const vendor = await User.findById(req.user._id);
      vendor.profile_image_url = `/uploads/${req.file.filename}`;
      await vendor.save();

      return res.json({
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        phone: vendor.phone,
        city_area: vendor.city_area,
        profile_image_url: vendor.profile_image_url,
        shop_image_url: vendor.shop_image_url || null,
      });
    } catch (error) {
      return res.status(500).json({ detail: "Upload failed." });
    }
  }
);

router.post(
  "/me/upload/shop-image",
  authMiddleware,
  requireRole("vendor"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ detail: "No file uploaded." });
      }

      const vendor = await User.findById(req.user._id);
      vendor.shop_image_url = `/uploads/${req.file.filename}`;
      await vendor.save();

      return res.json({
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        phone: vendor.phone,
        city_area: vendor.city_area,
        profile_image_url: vendor.profile_image_url || null,
        shop_image_url: vendor.shop_image_url,
      });
    } catch (error) {
      return res.status(500).json({ detail: "Upload failed." });
    }
  }
);

router.get("/:vendorId/ratings", authMiddleware, async (req, res) => {
  try {
    const rows = await Rating.find({ vendor_id: req.params.vendorId }).sort({ createdAt: -1 });
    return res.json(
      rows.map((r) => ({
        rating_id: r._id.toString(),
        job_id: r.job_id.toString(),
        customer_id: r.customer_id.toString(),
        vendor_id: r.vendor_id.toString(),
        stars: r.stars,
        review_text: r.review_text,
        created_at: r.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load ratings." });
  }
});

router.get("/me/services", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const services = await VendorService.find({ vendor_id: req.user._id }).sort({ createdAt: -1 });

    return res.json(
      services.map((s) => ({
        id: s._id.toString(),
        vendor_id: s.vendor_id.toString(),
        service_type: s.service_type,
        base_price: s.base_price,
        created_at: s.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ detail: "Failed to load services." });
  }
});

router.post("/me/services", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const { service_type, base_price } = req.body;

    if (!service_type || !service_type.trim()) {
      return res.status(400).json({ detail: "Service type is required." });
    }

    const service = await VendorService.create({
      vendor_id: req.user._id,
      service_type: service_type.trim(),
      base_price: base_price !== null && base_price !== undefined && base_price !== ""
        ? Number(base_price)
        : null,
    });

    return res.status(201).json({
      id: service._id.toString(),
      vendor_id: service.vendor_id.toString(),
      service_type: service.service_type,
      base_price: service.base_price,
      created_at: service.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ detail: "Add service failed." });
  }
});

router.delete("/me/services/:serviceId", authMiddleware, requireRole("vendor"), async (req, res) => {
  try {
    const service = await VendorService.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ detail: "Service not found." });
    }

    if (service.vendor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ detail: "Access denied." });
    }

    await VendorService.findByIdAndDelete(req.params.serviceId);

    return res.json({ message: "Service deleted." });
  } catch (error) {
    return res.status(500).json({ detail: "Delete failed." });
  }
});

module.exports = router;