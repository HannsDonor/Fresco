import type { LaundryStatus } from "./constants";

interface StatusColor {
  dot: string;
  bar: string;
  badge: string;
}

export const STATUS_SEQUENCE: Record<LaundryStatus, number> = {
  Pending: 0,
  Accepted: 1,
  Washing: 2,
  Drying: 3,
  Folding: 4,
  "Ready for Pickup": 5,
  Completed: 6,
  Cancelled: 7,
  Rejected: 8,
};

export const STATUS_COLORS: Record<LaundryStatus, StatusColor> = {
  Pending: {
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  Accepted: {
    dot: "bg-brand-500",
    bar: "bg-brand-500",
    badge: "bg-brand-100 text-brand-700",
  },
  Washing: {
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700",
  },
  Drying: {
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
  },
  Folding: {
    dot: "bg-teal-500",
    bar: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700",
  },
  "Ready for Pickup": {
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700",
  },
  Completed: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  Cancelled: {
    dot: "bg-red-500",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-600",
  },
  Rejected: {
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    badge: "bg-rose-100 text-rose-600",
  },
};

export function statusColor(status: string): StatusColor {
  return STATUS_COLORS[status as LaundryStatus] ?? {
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  };
}

export const PAYMENT_BADGES: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
};

export function paymentBadge(status: string | null): string {
  return (status && PAYMENT_BADGES[status]) || "bg-slate-100 text-slate-600";
}