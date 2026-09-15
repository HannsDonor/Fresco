"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
} from "lucide-react";
import type { AdminServiceRow } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { ServiceIconGlyph } from "@/components/admin/ServiceIconGlyph";
import ServiceFormModal from "@/components/admin/ServiceFormModal";

interface Banner {
  type: "success" | "error";
  text: string;
}

type ModalState = { mode: "create" } | { mode: "edit"; service: AdminServiceRow } | null;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function ServicesManager() {
  const [services, setServices] = useState<AdminServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchServices() {
      try {
        const response = await fetch("/api/admin/services");
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
        } else {
          setServices(json.services ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchServices();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!banner) return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const handleSaved = useCallback(() => {
    setModal(null);
    setBanner({ type: "success", text: "Service saved successfully." });
    setReloadKey((key) => key + 1);
  }, []);

  async function toggleActive(service: AdminServiceRow) {
    const next = service.is_active === 1 ? false : true;
    setTogglingId(service.service_id);
    setBanner(null);
    try {
      const response = await fetch(`/api/admin/services/${service.service_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to update service." });
        return;
      }
      setServices((prev) =>
        prev.map((item) =>
          item.service_id === service.service_id ? { ...item, is_active: next ? 1 : 0 } : item
        )
      );
      setBanner({
        type: "success",
        text: `${service.name} is now ${next ? "active" : "inactive"}.`,
      });
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteService(service: AdminServiceRow) {
    setDeletingId(service.service_id);
    setBanner(null);
    try {
      const response = await fetch(`/api/admin/services/${service.service_id}`, {
        method: "DELETE",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to delete service." });
        setConfirmDeleteId(null);
        return;
      }
      setServices((prev) => prev.filter((item) => item.service_id !== service.service_id));
      setConfirmDeleteId(null);
      setBanner({ type: "success", text: `${service.name} was deleted.` });
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Services
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Manage the laundry services offered to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModal({ mode: "create" });
            setBanner(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Add Service
        </button>
      </div>

      {banner ? (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {banner.text}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-brand-100">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                {Array.from({ length: 6 }).map((__, col) => (
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
            Unable to load services. Please try again.
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
      ) : services.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <p className="text-[15px] font-medium text-slate-600">
            No services yet. Add your first service to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-500">
              {services.length.toLocaleString()}{" "}
              {services.length === 1 ? "service" : "services"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Starting Price</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((service) => (
                  <tr key={service.service_id} className="text-sm">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
                          <ServiceIconGlyph icon={service.icon} className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-800">{service.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[300px] px-5 py-3.5">
                      <p className="truncate text-slate-500" title={service.description ?? ""}>
                        {service.description ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {formatPrice(service.starting_price)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        <Ticket className="h-3.5 w-3.5" />
                        {service.order_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ActiveBadge isActive={service.is_active === 1} />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={service.is_active === 1}
                          aria-label={`Toggle ${service.name} active`}
                          disabled={togglingId === service.service_id}
                          onClick={() => toggleActive(service)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                            service.is_active === 1 ? "bg-brand-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                              service.is_active === 1 ? "left-[18px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(service.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmDeleteId === service.service_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-semibold text-red-600">Delete?</span>
                          <button
                            type="button"
                            disabled={deletingId !== null}
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletingId !== null}
                            onClick={() => deleteService(service)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                          >
                            {deletingId === service.service_id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModal({ mode: "edit", service });
                              setBanner(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(service.service_id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal ? (
        <ServiceFormModal
          service={modal.mode === "edit" ? modal.service : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}