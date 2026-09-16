"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Home,
  LoaderCircle,
  Radar,
  WashingMachine,
  AlertTriangle,
} from "lucide-react";
import { TRACKING_TOKEN_STORAGE_KEY } from "@/lib/constants";

const REFRESH_INTERVAL_MS = 30_000;

const STATUS_SEQUENCE = [
  "Pending",
  "Accepted",
  "In Progress",
  "Ready for Pickup",
  "Completed",
] as const;

interface TimelineEntry {
  status_id: number;
  status: string;
  note: string | null;
  updated_at: string;
}

interface OrderData {
  order_reference: string;
  tracking_token: string;
  order_status: string;
  total_amount: string | number;
  created_at: string;
  service: { name: string; starting_price: string | number };
  load_type: string;
  special_instructions: string | null;
  pickup_date: string;
  pickup_time: string;
  customer: { name: string };
  timeline: TimelineEntry[];
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return "—";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return m === "00" ? `${displayHour} ${period}` : `${displayHour}:${m} ${period}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-right text-[15px] font-bold text-slate-800">{value}</span>
    </div>
  );
}

export default function OrderTracking({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/tracking/${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => null);

        if (cancelled) return;
        if (!response.ok || !data?.success) {
          setError(true);
          return;
        }
        setOrder(data.order);
        try {
          window.localStorage.setItem(TRACKING_TOKEN_STORAGE_KEY, data.order.tracking_token);
        } catch {
          // Storage unavailable — ignore.
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/tracking/${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => null);
        if (response.ok && data?.success) {
          setOrder(data.order);
        }
      } catch {
        // Keep showing the last known status if a refresh fails.
      }
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [token]);

  const currentIndex = order
    ? STATUS_SEQUENCE.findIndex((status) => status === order.order_status)
    : -1;
  const isCancelled = order?.order_status === "Cancelled";
  const isDeclined = order?.order_status === "Rejected";

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <header className="border-b border-brand-900/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Home className="h-[18px] w-[18px]" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-5 py-12 sm:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-2xl">
          {loading ? (
            <div className="flex flex-col items-center gap-4 rounded-[1.75rem] bg-white px-6 py-16 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100">
              <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium text-slate-500">Loading your order...</p>
            </div>
          ) : error || !order ? (
            <div className="rounded-[1.75rem] bg-white px-6 py-16 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500 ring-1 ring-red-100">
                <Radar className="h-8 w-8" />
              </span>
              <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                Order not found
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                We couldn&apos;t find an order with that tracking ID. Please double-check your
                link or contact FRESCO directly.
              </p>
              <Link
                href="/tracking"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
              >
                <Radar className="h-5 w-5" />
                Track Another Order
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] bg-white px-6 py-8 shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:px-10">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Tracking
                      <span className="ml-2 font-mono text-brand-600">
                        {order.tracking_token}
                      </span>
                    </h1>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-400">
                      {order.order_reference}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                      isCancelled
                        ? "bg-red-100 text-red-600"
                        : isDeclined
                          ? "bg-rose-100 text-rose-600"
                          : currentIndex >= STATUS_SEQUENCE.length - 1
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {order.order_status}
                  </span>
                </div>

                <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                  <DetailRow label="Order Reference" value={order.order_reference} />
                  <DetailRow label="Customer" value={order.customer.name} />
                  <DetailRow label="Service" value={order.service.name} />
                  <DetailRow
                    label="Pickup Date"
                    value={formatDate(order.pickup_date)}
                  />
                  <DetailRow label="Pickup Time" value={formatTime(order.pickup_time)} />
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white px-6 py-8 shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:px-10">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                  Order Timeline
                </h2>

                {isCancelled ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm leading-relaxed text-red-700">
                      This order has been cancelled. Contact FRESCO if you have questions.
                    </p>
                  </div>
                ) : isDeclined ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <p className="text-sm leading-relaxed text-rose-700">
                      This order was not accepted. Contact FRESCO if you have questions.
                    </p>
                  </div>
                ) : null}

                <ol className="mt-6 space-y-1">
                  {STATUS_SEQUENCE.map((status, index) => {
                    const done = currentIndex >= index;
                    const active = currentIndex === index;
                    return (
                      <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
                        {index < STATUS_SEQUENCE.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className={`absolute left-[13px] top-7 h-full w-0.5 ${
                              currentIndex > index ? "bg-brand-400" : "bg-slate-200"
                            }`}
                          />
                        ) : null}
                        <span
                          className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${
                            active
                              ? "bg-brand-500 text-white ring-brand-500/20 shadow-lg shadow-brand-500/30"
                              : done
                                ? "bg-brand-600 text-white ring-white"
                                : "bg-white text-slate-300 ring-slate-100"
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span
                            className={`block text-[15px] font-bold ${
                              active ? "text-brand-700" : done ? "text-slate-800" : "text-slate-400"
                            }`}
                          >
                            {status === "Ready for Pickup" ? "Ready for Pickup" : status}
                            {active ? (
                              <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500 align-middle" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {order.timeline.find((entry) => entry.status === status)?.note ??
                              (done
                                ? `Status updated to ${status}.`
                                : "")}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-[1.75rem] bg-white px-6 py-6 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100">
                <p className="text-sm leading-relaxed text-slate-600">
                  Save this link to check your order anytime — no account required.
                </p>
                <p className="mt-2 font-mono text-base font-bold text-slate-900">
                  {order.tracking_token}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-400">
                  This page updates automatically every 30 seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}