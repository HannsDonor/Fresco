"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";
import type { AdminOrderRow } from "@/lib/types";
import { formatDateShort, formatPrice, formatTime } from "@/lib/format";
import { LAUNDRY_STATUSES } from "@/lib/constants";
import StatusBadge, { PaymentBadge } from "@/components/admin/StatusBadge";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

type StatusFilter = "all" | (typeof LAUNDRY_STATUSES)[number];
type DateFilter = "all" | "today" | "upcoming";

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming Pickup" },
];

const selectClasses =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export default function OrdersManager({ initialOrderId }: { initialOrderId?: number }) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(initialOrderId);
  const skipFirstDebounce = useRef(true);

  useEffect(() => {
    if (skipFirstDebounce.current) {
      skipFirstDebounce.current = false;
      return;
    }
    const trimmed = searchInput.trim();
    if (trimmed === q) return;
    const timeout = window.setTimeout(() => {
      setQ(trimmed);
      setError(false);
      setLoading(true);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput, q]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status !== "all") params.set("status", status);
        if (date !== "all") params.set("date", date);

        const response = await fetch(`/api/admin/orders?${params.toString()}`);
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
        } else {
          setOrders(json.orders ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [q, status, date, reloadKey]);

  const handleUpdated = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Manage and monitor customer laundry orders.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by reference, customer name, or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setError(false);
                setLoading(true);
              }}
              className={`${selectClasses} pr-9`}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {LAUNDRY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={date}
              onChange={(event) => {
                setDate(event.target.value as DateFilter);
                setError(false);
                setLoading(true);
              }}
              className={`${selectClasses} pr-9`}
              aria-label="Filter by date"
            >
              {DATE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-brand-100">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                {Array.from({ length: 8 }).map((__, col) => (
                  <div
                    key={col}
                    className={`h-3.5 animate-pulse rounded bg-brand-100 ${
                      col === 0 ? "w-28" : "flex-1"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">
            Unable to load orders. Please try again.
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
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
            <CalendarDays className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">No orders found.</p>
          {(q || status !== "all" || date !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQ("");
                setStatus("all");
                setDate("all");
                setError(false);
                setLoading(true);
              }}
              className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-500">
              {orders.length.toLocaleString()}{" "}
              {orders.length === 1 ? "order" : "orders"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Order Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3">Pickup Date</th>
                  <th className="px-5 py-3">Pickup Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => setSelectedOrderId(order.order_id)}
                    className="cursor-pointer text-sm transition-colors hover:bg-brand-50/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-slate-700">
                      {order.order_reference}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {order.customer_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{order.customer_phone}</td>
                    <td className="px-5 py-3.5 text-slate-500">{order.service_name}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                      {order.item_count}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateShort(order.pickup_date)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatTime(order.pickup_time)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentBadge status={order.payment_status} />
                        {order.payment_method ? (
                          <span className="text-[11px] font-medium text-slate-400">
                            {order.payment_method}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrderId(order.order_id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrderId ? (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(undefined)}
          onUpdated={handleUpdated}
        />
      ) : null}
    </div>
  );
}