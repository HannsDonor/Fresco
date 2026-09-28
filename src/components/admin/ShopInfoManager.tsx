"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  Store,
  Trash2,
} from "lucide-react";
import type { AdminShopInfo, ShopHoursDay } from "@/lib/types";
import { SHOP_DAYS, type ShopDay } from "@/lib/constants";

const DAY_LABELS: Record<ShopDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const EMPTY_HOURS = SHOP_DAYS.reduce(
  (acc, day) => {
    acc[day] = { open: "", close: "" };
    return acc;
  },
  {} as Record<ShopDay, ShopHoursDay>
);

const GCASH_NUMBER_MAX_LENGTH = 11;

const EMPTY_CLOSED = SHOP_DAYS.reduce(
  (acc, day) => {
    acc[day] = false;
    return acc;
  },
  {} as Record<ShopDay, boolean>
);

interface Banner {
  type: "success" | "error";
  text: string;
}

function formatClock(value: string): string {
  if (!value) return "";
  const [hourStr, minute] = value.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return minute === "00" ? `${display} ${period}` : `${display}:${minute} ${period}`;
}

function displayHours(hours: ShopHoursDay): string {
  if (!hours.open && !hours.close) return "";
  return `${formatClock(hours.open)} – ${formatClock(hours.close)}`;
}

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

const timeInputClasses =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export default function ShopInfoManager() {
  const [info, setInfo] = useState<AdminShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState<Record<ShopDay, ShopHoursDay>>(EMPTY_HOURS);
  const [closedDays, setClosedDays] = useState<Record<ShopDay, boolean>>(EMPTY_CLOSED);
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashQrPath, setGcashQrPath] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrInputKey, setQrInputKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [savingGcash, setSavingGcash] = useState(false);
  const [savedGcashNumber, setSavedGcashNumber] = useState("");
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchShopInfo() {
      try {
        const response = await fetch("/api/admin/shop-information");
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
          return;
        }
        const data = json.data as AdminShopInfo;
        setInfo(data);
        setShopName(data.shop_name);
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setAddress(data.address ?? "");
        setGcashNumber(data.gcash_number ?? "");
        setSavedGcashNumber(data.gcash_number ?? "");
        setGcashQrPath(data.gcash_qr_path ?? null);
        const nextClosed = { ...EMPTY_CLOSED };
        for (const day of SHOP_DAYS) {
          const { open, close } = data.hours[day];
          nextClosed[day] = !open && !close;
        }
        setHours({ ...EMPTY_HOURS, ...data.hours });
        setClosedDays(nextClosed);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchShopInfo();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!banner) return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  function setHour(day: ShopDay, field: "open" | "close", value: string) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setBanner(null);
  }

  function toggleClosed(day: ShopDay, isClosed: boolean) {
    setClosedDays((prev) => ({ ...prev, [day]: isClosed }));
    setBanner(null);
  }

  function markDirty() {
    setBanner(null);
  }

  const gcashDigits = gcashNumber.replace(/\D/g, "");

  function handleGcashNumberChange(raw: string) {
    setGcashNumber(raw.replace(/\D/g, "").slice(0, GCASH_NUMBER_MAX_LENGTH));
    markDirty();
  }

  async function handleSaveGcashNumber() {
    const digits = gcashNumber.replace(/\D/g, "");
    if (digits && !/^09\d{9}$/.test(digits)) {
      setBanner({
        type: "error",
        text: "GCash number must be an 11-digit Philippine mobile number starting with 09.",
      });
      return;
    }

    setSavingGcash(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/shop-information", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gcash_number: digits || null }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to save the GCash number." });
        return;
      }
      setSavedGcashNumber(digits);
      setGcashNumber(digits);
      setBanner({ type: "success", text: "GCash number saved." });
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setSavingGcash(false);
    }
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setBanner(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/shop-information/gcash-qr", {
        method: "POST",
        body: form,
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({
          type: "error",
          text: json?.error ?? "Failed to upload the GCash QR code.",
        });
        return;
      }
      setGcashQrPath(json.gcash_qr_path ?? null);
      setQrInputKey((key) => key + 1);
      setBanner({ type: "success", text: "GCash QR code uploaded." });
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setUploadingQr(false);
    }
  }

  async function handleQrRemove() {
    setUploadingQr(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/shop-information/gcash-qr", {
        method: "DELETE",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({
          type: "error",
          text: json?.error ?? "Failed to remove the GCash QR code.",
        });
        return;
      }
      setGcashQrPath(null);
      setQrInputKey((key) => key + 1);
      setBanner({ type: "success", text: "GCash QR code removed." });
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setUploadingQr(false);
    }
  }

  async function handleSave() {
    if (!shopName.trim()) {
      setBanner({ type: "error", text: "Shop name is required." });
      return;
    }

    const digits = gcashNumber.replace(/\D/g, "");
    if (digits && !/^09\d{9}$/.test(digits)) {
      setBanner({
        type: "error",
        text: "GCash number must be an 11-digit Philippine mobile number starting with 09.",
      });
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const payload: Record<string, unknown> = {
        shop_name: shopName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        gcash_number: digits || null,
        hours: SHOP_DAYS.reduce((acc, day) => {
          const isClosed = closedDays[day];
          acc[day] = {
            open: isClosed ? null : hours[day].open || null,
            close: isClosed ? null : hours[day].close || null,
          };
          return acc;
        }, {} as Record<ShopDay, unknown>),
      };

      const response = await fetch("/api/admin/shop-information", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to save shop information." });
        return;
      }
      setBanner({ type: "success", text: "Shop information saved successfully." });
      setReloadKey((key) => key + 1);
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Shop Information
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Keep contact details and operating hours up to date.
          </p>
        </div>
        <button
          type="button"
          disabled={saving || loading || !info}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
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
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-white p-6 ring-1 ring-brand-100">
              <div className="h-5 w-40 animate-pulse rounded-md bg-brand-100" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((__, col) => (
                  <div
                    key={col}
                    className={`h-4 animate-pulse rounded bg-brand-100 ${
                      col % 2 === 0 ? "w-full" : "w-2/3"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error || !info ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">
            Unable to load shop information. Please try again.
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
              <Store className="h-5 w-5 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900">Contact Information</h2>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div>
                <label htmlFor="shop-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="shop-name"
                  type="text"
                  value={shopName}
                  maxLength={150}
                  onChange={(event) => {
                    setShopName(event.target.value);
                    markDirty();
                  }}
                  className={inputClasses}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="shop-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                    <Phone className="mr-1.5 inline h-4 w-4 text-slate-400" />
                    Phone
                  </label>
                  <input
                    id="shop-phone"
                    type="text"
                    value={phone}
                    maxLength={50}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. (02) 8123-4567"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="shop-email" className="mb-2 block text-sm font-semibold text-slate-700">
                    <Mail className="mr-1.5 inline h-4 w-4 text-slate-400" />
                    Email
                  </label>
                  <input
                    id="shop-email"
                    type="email"
                    value={email}
                    maxLength={150}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. hello@fresco.ph"
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="shop-address" className="mb-2 block text-sm font-semibold text-slate-700">
                  <MapPin className="mr-1.5 inline h-4 w-4 text-slate-400" />
                  Address
                </label>
                <textarea
                  id="shop-address"
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    markDirty();
                  }}
                  placeholder="Full shop address"
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm ring-1 ring-brand-100 lg:row-span-2">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
              <Clock className="h-5 w-5 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900">Operating Hours</h2>
            </div>
            <div className="flex flex-1 flex-col px-6 py-5">
              <p className="mb-4 text-xs font-medium text-slate-500">
                Tick <span className="font-bold">Closed</span> on days the shop is not open.
                The shop is treated as closed when both times are empty.
              </p>
              <div className="flex flex-1 flex-col gap-3">
                {SHOP_DAYS.map((day) => {
                  const dayHours = hours[day];
                  const closed = closedDays[day];
                  const display = closed
                    ? "Closed"
                    : displayHours(dayHours) || "Set hours";
                  return (
                    <div
                      key={day}
                      className="flex flex-1 flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center justify-between gap-3 sm:w-56">
                        <div className="sm:w-36">
                          <p className="text-sm font-bold text-slate-800">{DAY_LABELS[day]}</p>
                          <p
                            className={`text-xs font-medium ${
                              closed ? "text-slate-400" : "text-brand-600"
                            }`}
                          >
                            {display}
                          </p>
                        </div>
                        <label
                          htmlFor={`${day}-closed`}
                          className="flex cursor-pointer select-none items-center gap-1.5 text-xs font-semibold text-slate-500"
                        >
                          <input
                            id={`${day}-closed`}
                            type="checkbox"
                            checked={closed}
                            onChange={(event) => toggleClosed(day, event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                          />
                          Closed
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <label
                          htmlFor={`${day}-open`}
                          className="sr-only"
                        >
                          {DAY_LABELS[day]} open
                        </label>
                        <input
                          id={`${day}-open`}
                          type="time"
                          value={dayHours.open}
                          disabled={closed}
                          onChange={(event) => setHour(day, "open", event.target.value)}
                          className={`${timeInputClasses} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                        />
                        <span className="text-xs font-bold text-slate-400">to</span>
                        <label htmlFor={`${day}-close`} className="sr-only">
                          {DAY_LABELS[day]} close
                        </label>
                        <input
                          id={`${day}-close`}
                          type="time"
                          value={dayHours.close}
                          disabled={closed}
                          onChange={(event) => setHour(day, "close", event.target.value)}
                          className={`${timeInputClasses} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
              <QrCode className="h-5 w-5 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900">GCash Payments</h2>
            </div>
            <div className="space-y-6 px-6 py-5">
              <div>
                <label
                  htmlFor="gcash-number"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  GCash Number
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    id="gcash-number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={gcashNumber}
                    maxLength={GCASH_NUMBER_MAX_LENGTH}
                    onChange={(event) => handleGcashNumberChange(event.target.value)}
                    placeholder="09171234567"
                    className={`${inputClasses} sm:max-w-64`}
                  />
                  <button
                    type="button"
                    disabled={savingGcash || loading || !info || gcashDigits === savedGcashNumber}
                    onClick={handleSaveGcashNumber}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingGcash ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Number
                      </>
                    )}
                  </button>
                  {gcashDigits === savedGcashNumber && !savingGcash ? (
                    <span className="shrink-0 text-xs font-semibold text-emerald-600">Saved</span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Up to {GCASH_NUMBER_MAX_LENGTH} digits, starting with 09 (e.g.{" "}
                  <span className="font-semibold text-slate-600">0917 123 4567</span>). Leave empty to
                  clear.
                </p>

                <div>
                  <label
                    htmlFor="gcash-qr"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    QR Code Image
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
                      {gcashQrPath ? (
                        <Image
                          src={gcashQrPath}
                          alt="Current GCash QR code"
                          width={256}
                          height={256}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="px-2 text-center text-xs font-medium text-slate-400">
                          No image set
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        key={qrInputKey}
                        id="gcash-qr"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleQrUpload}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
                      />
                      {gcashQrPath ? (
                        <button
                          type="button"
                          onClick={handleQrRemove}
                          disabled={uploadingQr}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove image
                        </button>
                      ) : null}
                      {uploadingQr ? (
                        <p className="flex items-center gap-2 text-xs font-semibold text-brand-600">
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Uploading...
                        </p>
                      ) : null}
                      <p className="text-xs font-medium text-slate-500">
                        PNG, JPG, or WEBP up to 2 MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}