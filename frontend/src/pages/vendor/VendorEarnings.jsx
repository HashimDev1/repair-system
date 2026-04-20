import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import Spinner from "../../components/Spinner";

export default function VendorEarnings() {
  const [earn, setEarn] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const e = await api.get("/payments/me/earnings");
      setEarn(e.data);

      const r = await api.get("/ratings/me");
      setReviews(r.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load earnings/reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Earnings & Reviews</h1>
          <p className="text-slate-600 mt-1">Earnings are based on paid COD jobs.</p>
        </div>
        <button
          onClick={loadAll}
          className="px-3 py-2 rounded-lg bg-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        {loading && <Spinner label="Loading..." />}
        {error && <div className="mt-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        {!loading && earn && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50">
              <div className="text-sm text-slate-600">Paid Jobs</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{earn.paid_jobs_count}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <div className="text-sm text-slate-600">Total Earnings</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">PKR {earn.total_paid_amount}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <div className="text-sm text-slate-600">Method</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{earn.method}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900">Recent Reviews</h2>

        {reviews.length === 0 ? (
          <div className="mt-3 text-slate-600">No reviews yet.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r.rating_id} className="p-4 rounded-xl bg-slate-50">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">★{r.stars}</span>
                  <span className="mx-2">•</span>
                  {r.customer_name}
                  <span className="mx-2">•</span>
                  {new Date(r.created_at).toLocaleString()}
                </div>
                {r.review_text && <div className="mt-2 text-slate-700">{r.review_text}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
