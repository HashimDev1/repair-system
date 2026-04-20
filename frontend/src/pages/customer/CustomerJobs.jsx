import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";

export default function CustomerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/jobs/me");
      setJobs(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
            Customer Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            My Jobs
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Post repair jobs, review vendor applicants, track progress, pay COD,
            and leave ratings after completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Refresh
          </button>

          <Link
            to="/customer/jobs/new"
            className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
          >
            Post New Job
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Jobs</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {jobs.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Open Jobs</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {jobs.filter((j) => j.status === "open").length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Completed Jobs</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {jobs.filter((j) => j.status === "completed").length}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        {loading && <Spinner label="Loading jobs..." />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📦
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No jobs yet
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Start by posting your first repair request. Add device details,
              budget, and images so vendors can send offers.
            </p>
            <Link
              to="/customer/jobs/new"
              className="mt-5 inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              Post Your First Job
            </Link>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        Job #{j.id}
                      </h3>
                      <StatusBadge status={j.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white border border-slate-100 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Service Type
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {j.service_type}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-100 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Budget
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          PKR {j.customer_budget}
                          {j.final_cost != null && (
                            <span className="ml-2 text-slate-500">
                              • Final: PKR {j.final_cost}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-100 p-4 md:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Address
                        </div>
                        <div className="mt-1 text-sm text-slate-700 break-words">
                          {j.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      to={`/customer/jobs/${j.id}`}
                      className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}