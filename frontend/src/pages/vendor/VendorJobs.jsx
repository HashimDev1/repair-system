import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";

export default function VendorJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/jobs/me");
      setJobs(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load assigned jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Assigned Jobs</h1>
          <p className="text-slate-600 mt-1">Update statuses and complete jobs professionally.</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 rounded-lg bg-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        {loading && <Spinner label="Loading jobs..." />}
        {error && <div className="mt-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-slate-600">
            No assigned jobs yet. Go to <Link className="font-semibold text-slate-900" to="/vendor/marketplace">Marketplace</Link> and apply.
          </div>
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
                    <span className="font-medium">Final Cost:</span> {j.final_cost != null ? `PKR ${j.final_cost}` : "—"}
                  </div>
                  <div className="text-sm text-slate-600 mt-1 truncate">
                    <span className="font-medium">Address:</span> {j.address}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/vendor/jobs/${j.id}`}
                    className="px-3 py-2 rounded-lg bg-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-300"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
