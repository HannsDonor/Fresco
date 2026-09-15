"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { AdminServiceRow } from "@/lib/types";
import { SERVICE_ICONS } from "@/lib/constants";
import { ServiceIconGlyph } from "@/components/admin/ServiceIconGlyph";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

const selectClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export default function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service?: AdminServiceRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(service);

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service?.starting_price ?? "");
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [isActive, setIsActive] = useState(service ? service.is_active === 1 : true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a service name.");
      return;
    }

    const amount = Number(price);
    if (price === "" || !Number.isFinite(amount) || amount < 0) {
      setError("Please enter a valid starting price.");
      return;
    }
    if (amount > 999999.99) {
      setError("Starting price is too large.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        isEdit ? `/api/admin/services/${service!.service_id}` : "/api/admin/services",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim() || null,
            starting_price: amount,
            icon: icon || null,
            is_active: isActive,
          }),
        }
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error ?? "Failed to save service.");
        return;
      }
      onSaved();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              {isEdit ? "Edit Service" : "Add Service"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit
                ? "Update the service details below."
                : "Add a new service to the laundry shop."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close service form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {error ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="service-name" className="mb-2 block text-sm font-semibold text-slate-700">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Wash & Fold"
              maxLength={100}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="service-description" className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="service-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short description shown to customers."
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="service-price" className="mb-2 block text-sm font-semibold text-slate-700">
                Starting Price (₱) <span className="text-red-500">*</span>
              </label>
              <input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="e.g. 80"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="service-icon" className="mb-2 block text-sm font-semibold text-slate-700">
                Icon
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="service-icon"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  className={selectClasses}
                >
                  <option value="">No icon</option>
                  {SERVICE_ICONS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
                  <ServiceIconGlyph icon={icon} className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3.5">
            <span>
              <span className="block text-sm font-semibold text-slate-700">Active</span>
              <span className="block text-xs text-slate-500">
                Visible to customers when booking.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((value) => !value)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isActive ? "bg-brand-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  isActive ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Service"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}