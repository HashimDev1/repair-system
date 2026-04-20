import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fullImageUrl } from "../../lib/api";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";

const NEXT_STATUS = {
  assigned: ["picked_up"],
  picked_up: ["in_repair"],
  in_repair: ["repaired"],
  repaired: ["ready_for_pickup"],
  ready_for_pickup: ["completed"],
};

export default function VendorJobDetails() {
  const { id } = useParams();
  const jobId = id;

  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      const j = await api.get(`/jobs/${jobId}`);
      setJob(j.data);

      const t = await api.get(`/jobs/${jobId}/timeline`);
      setTimeline(t.data || []);

      const allowed = NEXT_STATUS[j.data.status] || [];
      setNewStatus(allowed[0] || "");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (jobId) loadAll();
  }, [jobId]);

  async function updateStatus() {
    if (!newStatus) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/jobs/${jobId}/status`, {
        new_status: newStatus,
        note: note || null,
      });
      setNote("");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Status update failed.");
    } finally {
      setSaving(false);
    }
  }

  const images = useMemo(
    () => (job?.images || []).map((x) => fullImageUrl(x.image_url)),
    [job]
  );

  const allowedNext = job ? NEXT_STATUS[job.status] || [] : [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
            Vendor Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Assigned Job Details
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Review the repair request, follow the workflow, and update job
            progress step by step.
          </p>

          {job && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={job.status} />
              <div className="text-sm font-medium text-slate-700">
                Service: <span className="text-slate-900">{job.service_type}</span>
              </div>
            </div>
          )}
        </div>

        <Link
          to="/vendor/jobs"
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to My Jobs
        </Link>
      </section>

      {job && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Final Cost</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {job.final_cost != null ? `PKR ${job.final_cost}` : "Pending"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Preferred Time</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {job.preferred_time || "Not specified"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Current Stage</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 capitalize">
              {job.status?.replaceAll("_", " ")}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        {loading && <Spinner label="Loading job..." />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && job && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pickup Address
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {job.address}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Job ID
                </div>
                <div className="mt-2 text-sm break-all text-slate-700">
                  {jobId}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Problem Description
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {job.description}
              </div>
            </div>

            {images.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-900">Device Images</div>
                <p className="mt-1 text-sm text-slate-500">
                  Open any image to inspect the issue more clearly.
                </p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((src, idx) => (
                    <a
                      key={idx}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="group"
                    >
                      <img
                        className="h-32 w-full rounded-2xl border border-slate-200 bg-white object-cover shadow-sm transition group-hover:scale-[1.02]"
                        src={src}
                        alt={`device-${idx}`}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex flex-col gap-2">
                <div className="text-lg font-bold text-slate-900">Update Status</div>
                <div className="text-sm text-slate-600">
                  Follow the strict workflow:
                  <span className="font-medium text-slate-800">
                    {" "}
                    assigned → picked up → in repair → repaired → ready for pickup → completed
                  </span>
                </div>
              </div>

              {allowedNext.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-4 text-sm text-slate-600">
                  No further updates are allowed from the current status.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Next Status
                    </label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {allowedNext.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Progress Note <span className="text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 min-h-28 bg-white text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Picked up from customer, diagnosis started, parts replaced..."
                    />
                  </div>
                </div>
              )}

              <button
                disabled={saving || !newStatus || allowedNext.length === 0}
                onClick={updateStatus}
                className="mt-5 inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review all status changes and job progress updates.
            </p>
          </div>

          <button
            onClick={loadAll}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {timeline.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-5 text-sm text-slate-600">
            No status history yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {timeline.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={t.status} />
                  <div className="text-sm text-slate-600">
                    {new Date(t.changed_at).toLocaleString()}
                    <span className="mx-2">•</span>
                    {t.changed_by_role}
                  </div>
                </div>

                {t.note && (
                  <div className="mt-3 text-sm leading-6 text-slate-700">
                    {t.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}