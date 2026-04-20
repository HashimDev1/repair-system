import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function CreateJob() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    service_type: "",
    description: "",
    address: "",
    preferred_time: "",
    customer_budget: "",
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        service_type: form.service_type.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        preferred_time: form.preferred_time.trim() || null,
        customer_budget: Number(form.customer_budget),
      };

      const res = await api.post("/jobs", payload);
      const job = res.data;

      if (files.length > 0) {
        const fd = new FormData();
        for (const f of files) fd.append("files", f);

        await api.post(`/jobs/${job.id}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess("Job posted successfully.");
      navigate(`/customer/jobs/${job.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
        <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-slate-200">
          Customer Dashboard
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Post a New Job</h1>
        <p className="mt-3 text-sm md:text-base text-slate-300 leading-7">
          Add device details, explain the issue clearly, upload images, and set
          your budget so vendors can send accurate offers.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Step 1</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">Describe Problem</div>
          <p className="mt-2 text-sm text-slate-600">
            Mention brand, model, symptoms, and what kind of repair is needed.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Step 2</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">Upload Images</div>
          <p className="mt-2 text-sm text-slate-600">
            Clear photos help vendors understand the issue more accurately.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Step 3</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">Set Budget</div>
          <p className="mt-2 text-sm text-slate-600">
            Vendors will only apply with offers that fit your chosen budget.
          </p>
        </div>
      </section>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Repair Request Form</h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in the details carefully for the best vendor responses.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 border border-slate-100">
            Response quality improves with better details
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Service Type
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              placeholder="e.g. Mobile Repair, AC Repair, Laptop Repair"
              value={form.service_type}
              onChange={(e) => set("service_type", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Problem Description
            </label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 min-h-36 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              placeholder="Explain the issue, model/brand, symptoms, when the problem started, and any important details."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Address / Pickup Location
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              placeholder="Enter your address or pickup location"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Preferred Time <span className="text-slate-400">(optional)</span>
              </label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="e.g. Today 6–9pm"
                value={form.preferred_time}
                onChange={(e) => set("preferred_time", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Budget (PKR)
              </label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                type="number"
                min="1"
                placeholder="Enter your budget"
                value={form.customer_budget}
                onChange={(e) => set("customer_budget", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <label className="block text-sm font-semibold text-slate-700">
              Device Photos <span className="text-slate-400">(recommended)</span>
            </label>
            <input
              className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <div className="mt-3 text-xs text-slate-500 leading-6">
              Upload 2–4 clear images such as front view, back view, damaged
              area close-up, and model sticker if available.
            </div>

            {files.length > 0 && (
              <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-800">
                  Selected Files
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {files.map((file, idx) => (
                    <li key={`${file.name}-${idx}`} className="truncate">
                      • {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post Job"}
          </button>
        </form>
      </div>
    </div>
  );
}