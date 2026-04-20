import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fullImageUrl } from "../../lib/api";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";

export default function VendorMarketplace() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [applyOpen, setApplyOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [applyForm, setApplyForm] = useState({ proposed_cost: "", message: "" });
    const [applyError, setApplyError] = useState("");
    const [applying, setApplying] = useState(false);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/marketplace/jobs");
            setJobs(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.detail || "Failed to load marketplace jobs.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function openApply(job) {
        setApplyJob(job);
        setApplyForm({ proposed_cost: job.customer_budget, message: "" });
        setApplyError("");
        setApplyOpen(true);
    }

    async function submitApply(e) {
        e.preventDefault();
        if (!applyJob) return;

        setApplyError("");
        setApplying(true);
        try {
            await api.post(`/applications/jobs/${applyJob.id}`, {
                proposed_cost: Number(applyForm.proposed_cost),
                message: applyForm.message || null,
            });
            setApplyOpen(false);
            setApplyJob(null);
            await load();
            alert("Applied successfully.");
        } catch (err) {
            setApplyError(err?.response?.data?.detail || "Apply failed.");
        } finally {
            setApplying(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Marketplace</h1>
                    <p className="text-slate-600 mt-1">Browse open jobs and apply with your offer.</p>
                </div>

                <button
                    onClick={load}
                    className="px-3 py-2 rounded-lg bg-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-300"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
                {loading && <Spinner label="Loading marketplace..." />}
                {error && <div className="mt-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

                {!loading && !error && jobs.length === 0 && (
                    <div className="text-slate-600">No open jobs right now. Refresh after some time.</div>
                )}

                {!loading && jobs.length > 0 && (
                    <div className="divide-y">
                        {jobs.map((j) => (
                            <div key={j.id} className="py-4 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-semibold text-slate-900">Job #{j.id}</div>
                                        <StatusBadge status={j.status} />
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">
                                        <span className="font-medium">Service:</span> {j.service_type}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">
                                        <span className="font-medium">Budget:</span> PKR {j.customer_budget}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1 truncate">
                                        <span className="font-medium">Address:</span> {j.address}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                                        {j.description}
                                    </div>

                                    {j.images?.length > 0 && (
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            {j.images.slice(0, 4).map((img) => (
                                                <a key={img.id} href={fullImageUrl(img.image_url)} target="_blank" rel="noreferrer">
                                                    <img
                                                        className="h-14 w-14 rounded-xl object-cover border bg-white"
                                                        src={fullImageUrl(img.image_url)}
                                                        alt="device"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0 flex flex-col gap-2">
                                    <button
                                        onClick={() => openApply(j)}
                                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Apply Modal */}
            {applyOpen && applyJob && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Apply to Job #{applyJob.id}</h2>
                                <div className="text-sm text-slate-600 mt-1">
                                    Budget: PKR {applyJob.customer_budget} (your offer must be within budget)
                                </div>
                            </div>
                            <button
                                onClick={() => setApplyOpen(false)}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-900 text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>

                        {applyError && <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{applyError}</div>}

                        <form onSubmit={submitApply} className="mt-4 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Offer Price (PKR)</label>
                                <input
                                    className="mt-1 w-full rounded-lg border px-3 py-2"
                                    type="number"
                                    min="1"
                                    value={applyForm.proposed_cost}
                                    onChange={(e) => setApplyForm((p) => ({ ...p, proposed_cost: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Message (optional)</label>
                                <textarea
                                    textarea
                                    className="mt-1 w-full rounded-lg border px-3 py-2 min-h-24"

                                    value={applyForm.message}
                                    onChange={(e) => setApplyForm((p) => ({ ...p, message: e.target.value }))}
                                    placeholder="e.g., I can pick up today, repair in 2 hours."
                                />
                            </div>

                            <button
                                disabled={applying}
                                className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
                            >
                                {applying ? "Applying..." : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
