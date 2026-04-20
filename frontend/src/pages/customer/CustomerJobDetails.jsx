import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fullImageUrl } from "../../lib/api";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";

export default function CustomerJobDetails() {
  const { id } = useParams();
  const jobId = id;

  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selecting, setSelecting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);

  const [rating, setRating] = useState({ stars: 5, review_text: "" });
  const [msg, setMsg] = useState("");

  const isOpen = job?.status === "open";
  const isCompleted = job?.status === "completed";
  const isPaid = payment?.status === "paid";

  async function loadAll() {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const j = await api.get(`/jobs/${jobId}`);
      setJob(j.data);

      const t = await api.get(`/jobs/${jobId}/timeline`);
      setTimeline(t.data || []);

      if (j.data?.status === "open") {
        const a = await api.get(`/applications/jobs/${jobId}`);
        setApplicants(a.data || []);
        setPayment(null);
      } else {
        setApplicants([]);
        try {
          const p = await api.get(`/payments/jobs/${jobId}`);
          setPayment(p.data);
        } catch {
          setPayment(null);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (jobId) loadAll();
  }, [jobId]);

  async function cancelJob() {
    if (!confirm("Cancel this job? This is only allowed while job is open.")) return;
    setMsg("");
    try {
      await api.post(`/jobs/${jobId}/cancel`);
      setMsg("Job cancelled.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Cancel failed.");
    }
  }

  async function selectVendor(application_id) {
    if (!confirm("Select this vendor for your job? Other applications will be rejected.")) return;
    setError("");
    setMsg("");
    setSelecting(true);
    try {
      await api.post(`/applications/jobs/${jobId}/select`, { application_id });
      setMsg("Vendor selected. Job assigned.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Selection failed.");
    } finally {
      setSelecting(false);
    }
  }

  async function markPaid() {
    if (!confirm("Mark COD as paid?")) return;
    setError("");
    setMsg("");
    setPaying(true);
    try {
      await api.post(`/payments/jobs/${jobId}/mark-paid`);
      setMsg("Payment marked as paid.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Payment update failed.");
    } finally {
      setPaying(false);
    }
  }

  async function submitRating() {
    setError("");
    setMsg("");
    setRatingSaving(true);
    try {
      await api.post(`/ratings/jobs/${jobId}`, {
        stars: Number(rating.stars),
        review_text: rating.review_text || null,
      });
      setMsg("Rating submitted.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Rating failed.");
    } finally {
      setRatingSaving(false);
    }
  }

  const images = useMemo(
    () => (job?.images || []).map((x) => fullImageUrl(x.image_url)),
    [job]
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
            Customer Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Job Details
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Track applicants, manage progress, handle COD payment, and leave a review after completion.
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
          to="/customer/jobs"
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to My Jobs
        </Link>
      </section>

      {job && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Budget</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              PKR {job.customer_budget}
            </div>
          </div>

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
        </section>
      )}

      <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        {loading && <Spinner label="Loading job..." />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {msg && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {msg}
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
                  Click an image to view it in full size.
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

            {isOpen && (
              <div className="flex items-center gap-3">
                <button
                  onClick={cancelJob}
                  className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
                >
                  Cancel Job
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {job && job.status === "open" && (
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Applicants</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review vendor offers and choose the best match for this repair.
              </p>
            </div>

            <button
              onClick={loadAll}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {selecting && (
            <div className="mt-4 text-sm text-slate-600">
              Selecting vendor...
            </div>
          )}

          {applicants.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-5 text-sm text-slate-600">
              No vendors have applied yet. Check back again after some time.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {applicants.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-slate-900">
                        {a.vendor_name}
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white border border-slate-100 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Offer Price
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            PKR {a.proposed_cost}
                          </div>
                        </div>

                        <div className="rounded-xl bg-white border border-slate-100 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Average Rating
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {a.vendor_avg_rating}
                          </div>
                        </div>
                      </div>

                      {a.message && (
                        <div className="mt-4 rounded-xl bg-white border border-slate-100 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vendor Message
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-700">
                            {a.message}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-3 flex-wrap">
                        {a.vendor_profile_image_url && (
                          <a
                            href={fullImageUrl(a.vendor_profile_image_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="group"
                          >
                            <img
                              className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm transition group-hover:scale-[1.03]"
                              src={fullImageUrl(a.vendor_profile_image_url)}
                              alt="profile"
                            />
                          </a>
                        )}

                        {a.vendor_shop_image_url && (
                          <a
                            href={fullImageUrl(a.vendor_shop_image_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="group"
                          >
                            <img
                              className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm transition group-hover:scale-[1.03]"
                              src={fullImageUrl(a.vendor_shop_image_url)}
                              alt="shop"
                            />
                          </a>
                        )}

                        <Link to={`/vendor-public/${a.vendor_id}`} className="hidden">
                          hidden
                        </Link>
                      </div>
                    </div>

                    <div className="shrink-0 xl:w-44 flex flex-col gap-3">
                      <button
                        disabled={selecting}
                        onClick={() => selectVendor(a.id)}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        Select Vendor
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const r = await api.get(`/ratings/vendors/${a.vendor_id}`);
                            alert(
                              (r.data || [])
                                .slice(0, 5)
                                .map((x) => `★${x.stars} - ${x.customer_name}: ${x.review_text || ""}`)
                                .join("\n\n") || "No reviews yet."
                            );
                          } catch {
                            alert("Failed to load reviews.");
                          }
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        View Reviews
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {job && (
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Timeline</h2>
              <p className="mt-1 text-sm text-slate-500">
                Follow status updates for the repair process.
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
      )}

      {job && job.status !== "open" && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900">Payment</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cash on Delivery payment details for this job.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Cash on Delivery (COD)
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {payment?.status || "Not available yet"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {payment ? `PKR ${payment.amount}` : "—"}
                </div>
              </div>

              <div>
                <button
                  disabled={paying || !isCompleted || isPaid}
                  onClick={markPaid}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {isPaid ? "Paid" : paying ? "Marking..." : "Mark COD Paid"}
                </button>

                {!isCompleted && (
                  <div className="mt-2 text-xs text-slate-500">
                    You can mark payment only after the vendor completes the job.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900">Leave a Review</h2>
            <p className="mt-1 text-sm text-slate-500">
              Reviews can be submitted after payment is marked as paid.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Stars
                </label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  value={rating.stars}
                  onChange={(e) => setRating((p) => ({ ...p, stars: e.target.value }))}
                  disabled={!isPaid}
                >
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Review
                </label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 min-h-28 bg-white text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  value={rating.review_text}
                  onChange={(e) => setRating((p) => ({ ...p, review_text: e.target.value }))}
                  disabled={!isPaid}
                  placeholder="Write a short review..."
                />
              </div>

              <button
                disabled={!isPaid || ratingSaving}
                onClick={submitRating}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
              >
                {ratingSaving ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}