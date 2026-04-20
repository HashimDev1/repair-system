import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterVendor() {
  const { registerVendor } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city_area: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerVendor({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        city_area: form.city_area || null,
      });
      navigate("/vendor/profile");
    } catch (err) {
      setError(err?.response?.data?.detail || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
            Vendor Registration
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-slate-900">
            Create your vendor account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign up to manage your profile, browse open jobs, apply with offers,
            and track assigned repair work professionally.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              type="password"
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Phone Number <span className="text-slate-400">(optional)</span>
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              City / Area <span className="text-slate-400">(optional)</span>
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.city_area}
              onChange={(e) => set("city_area", e.target.value)}
              placeholder="e.g. DHA, Gulshan, Johar"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Vendor Account"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-slate-900 hover:underline"
            to="/login"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}