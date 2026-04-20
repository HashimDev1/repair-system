import React from "react";

export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="relative h-5 w-5">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-900 border-r-slate-700 animate-spin" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}