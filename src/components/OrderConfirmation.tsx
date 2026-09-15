"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Copy,
  Home,
  LoaderCircle,
  Radar,
  WashingMachine,
} from "lucide-react";

interface OrderData {
  order_reference: string;
  tracking_token: string;
  order_status: string;
  created_at: string;
  pickup_date: string;
  pickup_time: string;
  service: { name: string; starting_price: string | number };
  customer: { name: string };
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

function formatPickup(date: string, time: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  const dateLabel = parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const [h, m] = (time ?? "00:00").split(":");
  let hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const timeLabel = m === "00" ? `${hour} ${period}` : `${hour}:${m} ${period}`;
  return `${dateLabel} at ${timeLabel}`;
}

export default function OrderConfirmation({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(token));
  const [error, setError] = useState(() => !token);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;

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

  async function copyToken() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.tracking_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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
              <p className="text-sm font-medium text-slate-500">Loading your booking...</p>
            </div>
          ) : error || !order ? (
            <div className="rounded-[1.75rem] bg-white px-6 py-16 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500 ring-1 ring-red-100">
                <Radar className="h-8 w-8" />
              </span>
              <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                We couldn&apos;t find your booking
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                The tracking ID may be invalid. Check your tracking link or contact FRESCO
                directly.
              </p>
              <Link
                href="/tracking"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
              >
                <Radar className="h-5 w-5" />
                Track Your Laundry
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:px-10">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                  <Check className="h-8 w-8" strokeWidth={3} />
                </span>
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Laundry Request Submitted!
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Your order has been received. We&apos;ll process it shortly.
                </p>

                <div className="mt-8 space-y-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Order Reference</span>
                    <span className="font-mono text-lg font-extrabold text-slate-900">
                      {order.order_reference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                      <BadgeCheck className="h-4 w-4" />
                      Order Submitted / {order.order_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Customer</span>
                    <span className="text-[15px] font-bold text-slate-800">{order.customer.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Service</span>
                    <span className="text-[15px] font-bold text-slate-800">{order.service.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Date Submitted</span>
                    <span className="text-[15px] font-bold text-slate-800">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">Preferred Pickup</span>
                    <span className="text-right text-[15px] font-bold text-slate-800">
                      {formatPickup(order.pickup_date, order.pickup_time)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white px-6 py-8 shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:px-10">
                <h2 className="text-center text-xl font-extrabold tracking-tight text-slate-900">
                  Track Your Laundry
                </h2>
                <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-600">
                  Use this unique tracking link to check your laundry status anytime — no
                  account required.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className="rounded-2xl bg-slate-900 px-6 py-4 font-mono text-xl font-extrabold tracking-wider text-white">
                    {order.tracking_token}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={copyToken}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-brand-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Tracking ID
                      </>
                    )}
                  </button>
                  <Link
                    href={`/track/${encodeURIComponent(order.tracking_token)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
                  >
                    <Radar className="h-4 w-4" />
                    Track My Order
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}