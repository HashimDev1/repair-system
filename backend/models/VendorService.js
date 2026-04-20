const mongoose = require("mongoose");

const vendorServiceSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service_type: {
      type: String,
      required: true,
      trim: true,
    },
    base_price: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorService", vendorServiceSchema);