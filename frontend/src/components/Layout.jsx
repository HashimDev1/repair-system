import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
          isActive
            ? "bg-slate-900 text-white shadow-md"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { isLoggedIn, role, name, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="group">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-lg">
                  RS
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition">
                    Repair System
                  </div>
                  <div className="text-xs text-slate-500">
                    Semester Project Dashboard
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn && (
              <>
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/register/customer">Customer Signup</NavItem>
                <NavItem to="/register/vendor">Vendor Signup</NavItem>
              </>
            )}

            {isLoggedIn && role === "customer" && (
              <>
                <NavItem to="/customer/jobs">My Jobs</NavItem>
                <NavItem to="/customer/jobs/new">Post Job</NavItem>
              </>
            )}

            {isLoggedIn && role === "vendor" && (
              <>
                <NavItem to="/vendor/marketplace">Marketplace</NavItem>
                <NavItem to="/vendor/jobs">My Jobs</NavItem>
                <NavItem to="/vendor/profile">Profile</NavItem>
                <NavItem to="/vendor/earnings">Earnings</NavItem>
              </>
            )}

            {isLoggedIn && (
              <div className="ml-1 flex items-center gap-2">
                <div className="hidden sm:flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{name}</span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span className="capitalize">{role}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 shadow-md transition hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Repair System
            </div>
            <div className="text-sm text-slate-500">
              COD only. Demo system for semester project.
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Built for customer and vendor repair workflow management
          </div>
        </div>
      </footer>
    </div>
  );
}