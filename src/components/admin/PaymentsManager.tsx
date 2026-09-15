"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import type { AdminPaymentRow } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { PaymentBadge } from "@/components/admin/StatusBadge";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

type StatusFilter = "all" | (typeof PAYMENT_STATUSES)[number];
type DateFilter = "all" | "today";

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
];

const selectClasses =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-lg font-extrabold text-slate-900 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
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

    async function fetchPayments() {
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status !== "all") params.set("status", status);
        if (date !== "all") params.set("date", date);

        const response = await fetch(`/api/admin/payments?${params.toString()}`);
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
        } else {
          setPayments(json.payments ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPayments();
    return () => {
      cancelled = true;
    };
  }, [q, status, date, reloadKey]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleUpdated = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  async function markPaid(paymentId: number) {
    setPayingId(paymentId);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "Paid" }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedback({ type: "error", text: json?.error ?? "Failed to update payment." });
        return;
      }
      setFeedback({ type: "success", text: "Payment marked as Paid." });
      setReloadKey((key) => key + 1);
    } catch {
      setFeedback({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setPayingId(null);
    }
  }

  const totalCollected = payments.reduce(
    (sum, p) => (p.payment_status === "Paid" ? sum + Number(p.amount) : sum),
    0
  );
  const totalPending = payments.reduce(
    (sum, p) => (p.payment_status === "Pending" ? sum + Number(p.amount) : sum),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Payments
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Track and confirm customer payments.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Records"
          value={payments.length.toLocaleString()}
          icon={Wallet}
          accent="bg-brand-50 text-brand-600"
        />
        <SummaryCard
          label="Collected"
          value={formatPrice(totalCollected)}
          icon={Banknote}
          accent="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Pending Amount"
          value={formatPrice(totalPending)}
          icon={AlertTriangle}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {feedback ? (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by order reference or customer..."
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
              aria-label="Filter by payment status"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
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
                {Array.from({ length: 7 }).map((__, col) => (
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
            Unable to load payments. Please try again.
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
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
            <Banknote className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">No payments found.</p>
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
              {payments.length.toLocaleString()}{" "}
              {payments.length === 1 ? "payment" : "payments"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Order Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.payment_id} className="text-sm transition-colors hover:bg-brand-50/40">
                    <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-slate-700">
                      PY-{String(payment.payment_id).padStart(4, "0")}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(payment.order_id)}
                        className="font-mono text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                      >
                        {payment.order_reference}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {payment.customer_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{payment.payment_method}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentBadge status={payment.payment_status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {payment.payment_date ? formatDateTime(payment.payment_date) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(payment.order_id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {payment.payment_status === "Pending" ? (
                          <button
                            type="button"
                            disabled={payingId === payment.payment_id}
                            onClick={() => markPaid(payment.payment_id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {payingId === payment.payment_id ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Mark Paid
                          </button>
                        ) : null}
                      </div>
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