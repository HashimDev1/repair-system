import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterCustomer from "./pages/RegisterCustomer";
import RegisterVendor from "./pages/RegisterVendor";

import CustomerJobs from "./pages/customer/CustomerJobs";
import CreateJob from "./pages/customer/CreateJob";
import CustomerJobDetails from "./pages/customer/CustomerJobDetails";

import VendorMarketplace from "./pages/vendor/VendorMarketplace";
import VendorJobs from "./pages/vendor/VendorJobs";
import VendorJobDetails from "./pages/vendor/VendorJobDetails";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorEarnings from "./pages/vendor/VendorEarnings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register/customer" element={<RegisterCustomer />} />
          <Route path="/register/vendor" element={<RegisterVendor />} />

          {/* Customer */}
          <Route
            path="/customer/jobs"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/jobs/new"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerJobDetails />
              </ProtectedRoute>
            }
          />

          {/* Vendor */}
          <Route
            path="/vendor/marketplace"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorMarketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/jobs"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorJobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/earnings"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorEarnings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
