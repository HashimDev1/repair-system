import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Home() {
  const { isLoggedIn, role, name } = useAuth();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_white,_transparent_35%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-slate-200 backdrop-blur">
            Smart Repair Service Platform
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-bold leading-tight">
            Manage repair jobs with a cleaner, faster workflow
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-300 leading-7">
            Customers can post repair jobs with images and budget details.
            Vendors apply with offers, customers select the best option, and
            the full repair process is tracked from pickup to payment and
            review.
          </p>

          {!isLoggedIn ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                to="/login"
              >
                Login
              </Link>
              <Link
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                to="/register/customer"
              >
                Customer Signup
              </Link>
              <Link
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                to="/register/vendor"
              >
                Vendor Signup
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-slate-200 backdrop-blur">
                Logged in as <span className="font-semibold text-white">{name}</span>{" "}
                <span className="text-slate-300">({role})</span>
              </div>

              <div className="mt-4">
                {role === "customer" && (
                  <Link
                    className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                    to="/customer/jobs"
                  >
                    Go to My Jobs
                  </Link>
                )}
                {role === "vendor" && (
                  <Link
                    className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                    to="/vendor/marketplace"
                  >
                    Go to Marketplace
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="text-sm font-semibold text-slate-500">Step 1</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Customer Posts Job
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add repair details, upload device images, and set the expected
            budget.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="text-sm font-semibold text-slate-500">Step 2</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Vendors Apply
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Vendors browse open jobs and send offers within the customer’s
            budget.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="text-sm font-semibold text-slate-500">Step 3</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Track & Complete
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The selected vendor updates progress, and the customer pays COD and
            leaves a review.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">Demo Tips for Viva</h2>
        <p className="mt-2 text-sm text-slate-500">
          Use this flow to present the project clearly.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-slate-700">
            1. Post a repair job as customer with images and budget.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-slate-700">
            2. Login as vendor and apply with an offer.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-slate-700">
            3. Select vendor as customer from the applicants list.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-slate-700">
            4. Vendor updates job status until completed.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-slate-700 md:col-span-2">
            5. Customer marks COD paid and submits a review.
          </div>
        </div>
      </section>
    </div>
  );
}