import React from "react";

const MAP = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  assigned: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  picked_up: "bg-amber-50 text-amber-700 border border-amber-200",
  in_repair: "bg-orange-50 text-orange-700 border border-orange-200",
  repaired: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ready_for_pickup: "bg-teal-50 text-teal-700 border border-teal-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const DOT_MAP = {
  open: "bg-blue-500",
  assigned: "bg-indigo-500",
  picked_up: "bg-amber-500",
  in_repair: "bg-orange-500",
  repaired: "bg-emerald-500",
  ready_for_pickup: "bg-teal-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

function prettyStatus(status) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ");
}

export default function StatusBadge({ status }) {
  const cls = MAP[status] || "bg-slate-50 text-slate-700 border border-slate-200";
  const dot = DOT_MAP[status] || "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize shadow-sm ${cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {prettyStatus(status)}
    </span>
  );
}