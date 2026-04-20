const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    {
      user_id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authResponse(user) {
  const access_token = makeToken(user);

  return {
    access_token,
    token_type: "bearer",
    user_id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

router.post("/register/customer", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ detail: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "customer",
      phone: phone || null,
      address: address || null,
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    return res.status(500).json({ detail: "Customer registration failed." });
  }
});

router.post("/register/vendor", async (req, res) => {
  try {
    const { name, email, password, phone, city_area } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ detail: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "vendor",
      phone: phone || null,
      city_area: city_area || null,
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    return res.status(500).json({ detail: "Vendor registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ detail: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ detail: "Invalid email or password." });
    }

    return res.json(authResponse(user));
  } catch (error) {
    return res.status(500).json({ detail: "Login failed." });
  }
});

module.exports = router;