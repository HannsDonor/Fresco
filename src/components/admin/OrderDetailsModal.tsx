"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import type { AdminOrderDetail } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  formatTime,
} from "@/lib/format";
import { LOAD_TYPE_LABELS, PAYMENT_METHODS, type LoadType } from "@/lib/constants";
import StatusBadge, { PaymentBadge } from "@/components/admin/StatusBadge";

interface Feedback {
  type: "success" | "error";
  text: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
        {title}
      </h3>
      <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 px-5">
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">
        {children}
      </span>
    </div>
  );
}

function loadTypeLabel(value: string): string {
  return LOAD_TYPE_LABELS[value as LoadType] ?? value;
}

const DECISION_STATUSES = new Set(["Accepted", "Rejected"]);

const ACTIONABLE_STATUSES = new Set(["Accepted", "In Progress", "Ready for Pickup"]);

function QuickAction({
  label,
  icon,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "primary" | "secondary" | "danger";
}) {
  const toneClasses =
    tone === "primary"
      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600"
      : tone === "danger"
        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function OrderDetailsModal({
  orderId,
  onClose,
  onUpdated,
}: {
  orderId: number;
  onClose: () => void;
  onUpdated?: (kind: "status" | "payment") => void;
}) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [note, setNote] = useState("");
  const [confirmCancelled, setConfirmCancelled] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [payMethod, setPayMethod] = useState<string>("Cash");
  const [payStatus, setPayStatus] = useState<string>("Pending");
  const [payAmount, setPayAmount] = useState<string>("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
          return;
        }
        const fetched = json.order as AdminOrderDetail;
        setOrder(fetched);
        setPayMethod(fetched.payment_method ?? "Cash");
        setPayStatus(fetched.payment_status ?? "Pending");
        setPayAmount(String(fetched.total_amount ?? ""));
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadTick]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  async function handleStatusUpdate(targetStatus: string) {
    if (!order) return;
    if (targetStatus === order.order_status) return;

    if (targetStatus === "Cancelled" && !confirmCancelled) {
      setConfirmCancelled(true);
      return;
    }

    if (confirmDecline && DECISION_STATUSES.has(targetStatus)) {
      setConfirmDecline(null);
    } else if (DECISION_STATUSES.has(targetStatus) && targetStatus !== "Accepted") {
      setConfirmDecline(targetStatus);
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: targetStatus, note: note.trim() || undefined }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedback({ type: "error", text: json?.error ?? "Failed to update status." });
        return;
      }
      setConfirmCancelled(false);
      setConfirmDecline(null);
      setNote("");
      setFeedback({ type: "success", text: `Order status updated to ${targetStatus}.` });
      setReloadTick((tick) => tick + 1);
      onUpdated?.("status");
    } catch {
      setFeedback({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setUpdating(false);
    }
  }

  async function handlePaymentUpdate() {
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid amount." });
      return;
    }

    setPaying(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payment_method: payMethod,
          payment_status: payStatus,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedback({ type: "error", text: json?.error ?? "Failed to update payment." });
        return;
      }
      setFeedback({
        type: "success",
        text: `Payment marked as ${payStatus}.`,
      });
      setReloadTick((tick) => tick + 1);
      onUpdated?.("payment");
    } catch {
      setFeedback({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setPaying(false);
    }
  }

  const selectClasses =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

  const inputClasses =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

  const latestPayment =
    order && order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Order Details
              </h2>
              {order ? <StatusBadge status={order.order_status} /> : null}
            </div>
            <p className="mt-0.5 font-mono text-sm font-semibold text-brand-600">
              {order?.order_reference ?? "Loading..."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium text-slate-500">Loading order details...</p>
            </div>
          ) : error || !order ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <p className="text-[15px] font-medium text-slate-600">
                Unable to load this order. Please try again.
              </p>
              <button
                type="button"
                onClick={() => {
                setError(false);
                setLoading(true);
                setReloadTick((tick) => tick + 1);
              }}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <div>
              <Section title="Customer Information">
                <Row label="Name">{order.customer_name}</Row>
                <Row label="Phone">{order.customer_phone || "—"}</Row>
                <Row label="Address">{order.customer_address || "—"}</Row>
              </Section>

              <Section title="Laundry Information">
                <Row label="Service">{order.service_name}</Row>
                <Row label="Item Count">
                  {order.item_count} {order.item_count === 1 ? "item" : "items"}
                </Row>
                <Row label="Estimated Weight">
                  {order.estimated_weight ? `${order.estimated_weight} kg` : "—"}
                </Row>
                <Row label="Load Type">{loadTypeLabel(order.load_type)}</Row>
                <Row label="Special Instructions">{order.special_instructions || "—"}</Row>
                <Row label="Total Amount">{formatPrice(order.total_amount)}</Row>
              </Section>

              <Section title="Pickup Information">
                <Row label="Pickup Date">{formatDate(order.pickup_date)}</Row>
                <Row label="Pickup Time">{formatTime(order.pickup_time)}</Row>
              </Section>

              <Section title="Payment Information">
                <Row label="Payment Status">
                  <PaymentBadge status={order.payment_status} />
                </Row>
                <Row label="Payment Method">{order.payment_method ?? "—"}</Row>
                <Row label="Amount Paid">{formatPrice(order.total_paid)}</Row>
                <Row label="Order Total">{formatPrice(order.total_amount)}</Row>
                <Row label="Payment Date">
                  {latestPayment?.payment_date
                    ? formatDateTime(latestPayment.payment_date)
                    : "—"}
                </Row>
              </Section>

              <Section title="Order Information">
                <Row label="Order Reference">{order.order_reference}</Row>
                <Row label="Current Status">{order.order_status}</Row>
                <Row label="Created Date">{formatDateTime(order.created_at)}</Row>
              </Section>

              <Section title="Status History">
                {order.timeline.length === 0 ? (
                  <div className="py-4 text-center text-sm font-medium text-slate-500">
                    No status updates recorded yet.
                  </div>
                ) : (
                  <ol className="py-4">
                    {order.timeline.map((entry, index) => {
                      const isLast = index === order.timeline.length - 1;
                      return (
                        <li key={entry.status_id} className="relative flex gap-4 pb-6 last:pb-0">
                          {!isLast ? (
                            <span
                              aria-hidden="true"
                              className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-200"
                            />
                          ) : null}
                          <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-[15px] font-bold text-slate-800">
                              {entry.status}
                            </p>
                            {entry.note ? (
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                {entry.note}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDateTime(entry.updated_at)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Section>

              {order.order_status === "Pending" ? (
                <Section title="Accept Order">
                  <div className="py-4">
                    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <p className="text-sm leading-relaxed text-amber-800">
                        This order is awaiting your confirmation. Accept it to begin the
                        laundry process — status updates are locked until the order is
                        accepted.
                      </p>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={`accept-note-${orderId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Note <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        id={`accept-note-${orderId}`}
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="e.g. Confirmed with customer"
                        className={inputClasses}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleStatusUpdate("Accepted")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updating ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accept Order
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleStatusUpdate("Rejected")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>

                    {confirmDecline ? (
                      <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                          <p className="text-sm leading-relaxed text-red-700">
                            Are you sure you want to {confirmDecline.toLowerCase()} this order?
                            This cannot be undone.
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => setConfirmDecline(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Keep Order
                          </button>
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => handleStatusUpdate(confirmDecline)}
                            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {updating ? "Saving..." : "Yes, Confirm"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Section>
              ) : ACTIONABLE_STATUSES.has(order.order_status) ? (
                <Section title="Update Status">
                  <div className="py-4">
                    <div className="flex flex-wrap gap-3">
                      {order.order_status === "Accepted" ? (
                        <QuickAction
                          tone="primary"
                          disabled={updating}
                          icon={updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          label="Begin Processing"
                          onClick={() => handleStatusUpdate("In Progress")}
                        />
                      ) : null}
                      {order.order_status === "In Progress" ? (
                        <QuickAction
                          tone="primary"
                          disabled={updating}
                          icon={updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          label="Ready for Pickup"
                          onClick={() => handleStatusUpdate("Ready for Pickup")}
                        />
                      ) : null}
                      {order.order_status !== "Ready for Pickup" ? (
                        <QuickAction
                          tone="secondary"
                          disabled={updating}
                          icon={updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          label="Mark Ready for Pickup"
                          onClick={() => handleStatusUpdate("Ready for Pickup")}
                        />
                      ) : null}
                      <QuickAction
                        tone={order.order_status === "Ready for Pickup" ? "primary" : "secondary"}
                        disabled={updating}
                        icon={updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        label="Mark Completed"
                        onClick={() => handleStatusUpdate("Completed")}
                      />
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <QuickAction
                        tone="danger"
                        disabled={updating}
                        icon={updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        label="Cancel Order"
                        onClick={() => handleStatusUpdate("Cancelled")}
                      />
                    </div>

                    {confirmCancelled ? (
                      <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                          <p className="text-sm leading-relaxed text-red-700">
                            Are you sure you want to cancel this order? This cannot be undone.
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => setConfirmCancelled(false)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Keep Order
                          </button>
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => handleStatusUpdate("Cancelled")}
                            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {updating ? "Cancelling..." : "Yes, Cancel Order"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Section>
              ) : null}

              <Section title="Record Payment">
                <div className="py-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`pay-method-${orderId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Payment Method
                      </label>
                      <select
                        id={`pay-method-${orderId}`}
                        value={payMethod}
                        onChange={(event) => setPayMethod(event.target.value)}
                        className={selectClasses}
                      >
                        {PAYMENT_METHODS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`pay-status-${orderId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Payment Status
                      </label>
                      <select
                        id={`pay-status-${orderId}`}
                        value={payStatus}
                        onChange={(event) => setPayStatus(event.target.value)}
                        className={selectClasses}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`pay-amount-${orderId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Amount
                      </label>
                      <input
                        id={`pay-amount-${orderId}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={payAmount}
                        onChange={(event) => setPayAmount(event.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={paying}
                    onClick={handlePaymentUpdate}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {paying ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Payment"
                    )}
                  </button>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}