"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { AdminOrderRow, DashboardData, DashboardStatusCount } from "@/lib/types";
import { formatDateShort, formatPrice, formatTime } from "@/lib/format";
import { statusColor } from "@/lib/status";
import StatusBadge from "@/components/admin/StatusBadge";

interface KpiCard {
  key: keyof DashboardData["summary"];
  label: string;
  icon: LucideIcon;
  iconClasses: string;
}

const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total Orders", icon: ClipboardList, iconClasses: "bg-brand-500 text-white" },
  { key: "pending", label: "Pending Orders", icon: Clock, iconClasses: "bg-amber-100 text-amber-600" },
  { key: "active", label: "Active Orders", icon: LoaderCircle, iconClasses: "bg-sky-100 text-sky-600" },
  { key: "readyForPickup", label: "Ready for Pickup", icon: ShoppingBag, iconClasses: "bg-indigo-100 text-indigo-600" },
  { key: "completed", label: "Completed Orders", icon: CheckCircle2, iconClasses: "bg-emerald-100 text-emerald-600" },
  { key: "todayOrders", label: "Today's Orders", icon: CalendarDays, iconClasses: "bg-brand-100 text-brand-600" },
];

const cardClasses = "rounded-2xl bg-white shadow-sm ring-1 ring-brand-100";
const emptyStateClasses =
  "mt-5 rounded-xl bg-brand-50/70 px-4 py-10 text-center text-sm font-medium text-slate-500 ring-1 ring-brand-100";
const tableHeadClasses =
  "sticky top-0 z-10 bg-white pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400";

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

function SkeletonKpi() {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-brand-100" />
      <div className="mt-4 h-8 w-14 animate-pulse rounded-md bg-brand-100" />
      <div className="mt-2 h-3.5 w-24 animate-pulse rounded bg-brand-100" />
    </div>
  );
}

function SkeletonTableRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {Array.from({ length: 6 }).map((__, col) => (
            <div
              key={col}
              className={`h-3.5 animate-pulse rounded bg-brand-100 ${col === 0 ? "w-24" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard");
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
        } else {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    const interval = window.setInterval(() => {
      fetchDashboard();
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [reloadKey]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-[15px] text-slate-500">
          A quick overview of the laundry shop.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonKpi key={index} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-brand-100 lg:col-span-2">
              <div className="h-4 w-40 animate-pulse rounded bg-brand-100" />
              <div className="mt-6 space-y-3">
                <SkeletonTableRows rows={8} />
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-brand-100 lg:col-span-3">
              <div className="h-4 w-40 animate-pulse rounded bg-brand-100" />
              <div className="mt-6 space-y-3">
                <SkeletonTableRows rows={6} />
              </div>
            </div>
          </div>
        </div>
      ) : error || !data ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">
            Unable to load dashboard data. Please try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoading(true);
              setReloadKey((key) => key + 1);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.key} className={`${cardClasses} flex flex-col p-5`}>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClasses}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
                    {summary ? summary[card.key].toLocaleString() : "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <StatusOverview statusCounts={data.statusCounts} total={summary?.total ?? 0} />
            <RecentOrders orders={data.recentOrders} />
          </div>

          <TodayPickups orders={data.todayPickups} />
        </div>
      )}
    </div>
  );
}

interface DonutSegment {
  key: string;
  color: string;
  dash: number;
  offset: number;
}

function StatusDonut({
  statusCounts,
  total,
}: {
  statusCounts: DashboardStatusCount[];
  total: number;
}) {
  const size = 168;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = statusCounts.filter((entry) => entry.count > 0);

  const segments = visible.reduce<DonutSegment[]>((accumulated, entry) => {
    const consumed = accumulated.reduce((sum, segment) => sum + segment.dash, 0);
    const dash = (entry.count / total) * circumference;
    return [
      ...accumulated,
      {
        key: entry.status,
        color: statusColor(entry.status).hex,
        dash,
        offset: -consumed,
      },
    ];
  }, []);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label="Order status breakdown"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment) => (
          <circle
            key={segment.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={segment.offset}
            strokeLinecap="butt"
          >
            <title>{`${segment.key}: ${visible.find((entry) => entry.status === segment.key)?.count}`}</title>
          </circle>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
          {total.toLocaleString()}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Orders
        </span>
      </div>
    </div>
  );
}

function StatusOverview({
  statusCounts,
  total,
}: {
  statusCounts: DashboardStatusCount[];
  total: number;
}) {
  const hasOrders = total > 0;
  const max = statusCounts.reduce((peak, entry) => Math.max(peak, entry.count), 0);

  return (
    <div className={`${cardClasses} flex flex-col p-6 lg:col-span-2`}>
      <CardHeader title="Order Status Overview" />

      {!hasOrders ? (
        <div className={emptyStateClasses}>No orders yet.</div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <StatusDonut statusCounts={statusCounts} total={total} />

          <ul className="w-full min-w-0 flex-1 space-y-2.5">
            {statusCounts.map((entry) => {
              const share = total > 0 ? Math.round((entry.count / total) * 100) : 0;
              return (
                <li key={entry.status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-600">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(entry.status).dot}`}
                      />
                      <span className="truncate">{entry.status}</span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-1.5">
                      <span className="font-bold text-slate-900">
                        {entry.count.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{share}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${statusColor(entry.status).bar}`}
                      style={{ width: `${max > 0 ? (entry.count / max) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecentOrders({ orders }: { orders: AdminOrderRow[] }) {
  return (
    <div className={`${cardClasses} flex flex-col p-6 lg:col-span-3`}>
      <CardHeader
        title="Recent Orders"
        action={
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            View all
          </Link>
        }
      />

      {orders.length === 0 ? (
        <div className={emptyStateClasses}>No orders yet.</div>
      ) : (
        <div className="mt-5 max-h-80 overflow-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={`${tableHeadClasses} pr-4`}>Order Reference</th>
                <th className={`${tableHeadClasses} pr-4`}>Customer</th>
                <th className={`${tableHeadClasses} pr-4`}>Service</th>
                <th className={`${tableHeadClasses} pr-4`}>Pickup Date</th>
                <th className={tableHeadClasses}>Status</th>
                <th className={`${tableHeadClasses} pr-4 text-right`}>Total</th>
                <th className={`${tableHeadClasses} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.order_id} className="text-sm">
                  <td className="py-3 pr-4 font-mono text-[13px] font-semibold text-slate-700">
                    {order.order_reference}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-700">{order.customer_name}</td>
                  <td className="py-3 pr-4 text-slate-500">{order.service_name}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    {formatDateShort(order.pickup_date)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={order.order_status} />
                  </td>
                  <td className="py-3 pr-4 text-right font-bold text-slate-800">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/orders?order=${order.order_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TodayPickups({ orders }: { orders: AdminOrderRow[] }) {
  return (
    <div className={`${cardClasses} flex flex-col p-6`}>
      <div className="flex items-center gap-2.5">
        <h2 className="text-base font-bold text-slate-900">Today&apos;s Pickup Schedule</h2>
        <CalendarDays className="h-4 w-4 text-brand-500" />
      </div>

      {orders.length === 0 ? (
        <div className={emptyStateClasses}>No pickups scheduled for today.</div>
      ) : (
        <div className="mt-5 max-h-72 overflow-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={`${tableHeadClasses} pr-4`}>Order Reference</th>
                <th className={`${tableHeadClasses} pr-4`}>Customer</th>
                <th className={`${tableHeadClasses} pr-4`}>Pickup Time</th>
                <th className={`${tableHeadClasses} pr-4`}>Service</th>
                <th className={`${tableHeadClasses} text-right`}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.order_id} className="text-sm">
                  <td className="py-3 pr-4 font-mono text-[13px] font-semibold text-slate-700">
                    {order.order_reference}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-700">{order.customer_name}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">
                    {formatTime(order.pickup_time)}
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{order.service_name}</td>
                  <td className="py-3 text-right">
                    <StatusBadge status={order.order_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
