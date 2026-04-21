# Repair Marketplace Backend

A backend API for a repair service marketplace where customers can post repair jobs and vendors can browse listings, submit offers, manage assigned work, upload profile or shop images, and handle reviews and payment status.

## Overview

This project powers a marketplace platform for repair services. Customers can create repair requests by providing issue details, budget, location, preferred time, and device images. Vendors can explore available jobs, apply with an offer, and update job progress after being selected. Customers can then confirm payment and leave ratings and reviews based on the completed service.

## Features

- Customer job posting
- Vendor job applications with offer price
- Job assignment and status tracking
- Profile and shop image upload support
- Device image upload for repair requests
- Payment status handling
- Customer ratings and reviews
- JWT-based authentication and authorization
- RESTful API structure

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer
- dotenv

## Project Structure

```bash
backend/
├── middleware/       # Custom middleware
├── models/           # Mongoose models
├── node_modules/     # Project dependencies
├── routes/           # API route handlers
├── uploads/          # Uploaded files and images
├── .env              # Environment variables
├── package-lock.json # Dependency lock file
├── package.json      # Project metadata and scripts
└── server.js         # Application entry point