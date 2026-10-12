"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCw, Save, SlidersHorizontal } from "lucide-react";
import type { AdminShopInfo } from "@/lib/types";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

interface Banner {
  type: "success" | "error";
  text: string;
}

export default function ShopSettingsManager() {
  const [settings, setSettings] = useState<Pick<
    AdminShopInfo,
    "daily_capacity_kg" | "small_load_kg" | "medium_load_kg" | "large_load_kg"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/shop-information");
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
          return;
        }
        const data = json.data as AdminShopInfo;
        setSettings({
          daily_capacity_kg: data.daily_capacity_kg,
          small_load_kg: data.small_load_kg,
          medium_load_kg: data.medium_load_kg,
          large_load_kg: data.large_load_kg,
        });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!banner) return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  function updateSetting(
    field: keyof NonNullable<typeof settings>,
    value: number
  ) {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
    setBanner(null);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/shop-information", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to save shop settings." });
        return;
      }
      setBanner({ type: "success", text: "Shop settings saved successfully." });
      setReloadKey((key) => key + 1);
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const fields = settings
    ? [
        ["small_load_kg", "Small load (kg)", settings.small_load_kg],
        ["medium_load_kg", "Medium load (kg)", settings.medium_load_kg],
        ["large_load_kg", "Large load (kg)", settings.large_load_kg],
      ] as const
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Shop Settings
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Configure the shop&apos;s daily laundry capacity.
          </p>
        </div>
        <button
          type="button"
          disabled={saving || loading || !settings}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
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
          {banner.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {banner.text}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-brand-100">
          <div className="h-5 w-40 animate-pulse rounded-md bg-brand-100" />
          <div className="mt-5 h-20 animate-pulse rounded-xl bg-brand-100" />
        </div>
      ) : error || !settings ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-[15px] font-medium text-slate-600">
            Unable to load shop settings. Please try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoading(true);
              setReloadKey((key) => key + 1);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="max-w-3xl rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
            <SlidersHorizontal className="h-5 w-5 text-brand-500" />
            <h2 className="text-base font-bold text-slate-900">Daily Capacity</h2>
          </div>
          <div className="space-y-5 px-6 py-5">
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              Set the maximum estimated kilograms the shop can accept for one pickup date.
              Small uses 3 kg, Medium uses 6 kg, and Large uses 7 kg by default.
            </p>
            <div>
              <label htmlFor="daily-capacity-kg" className="mb-2 block text-sm font-semibold text-slate-700">
                Maximum daily capacity (kg)
              </label>
              <input
                id="daily-capacity-kg"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={settings.daily_capacity_kg}
                onChange={(event) => updateSetting("daily_capacity_kg", Number(event.target.value))}
                className={`${inputClasses} sm:max-w-64`}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {fields.map(([field, label, value]) => (
                <div key={field}>
                  <label htmlFor={field} className="mb-2 block text-sm font-semibold text-slate-700">
                    {label}
                  </label>
                  <input
                    id={field}
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    value={value}
                    onChange={(event) => updateSetting(field, Number(event.target.value))}
                    className={inputClasses}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
