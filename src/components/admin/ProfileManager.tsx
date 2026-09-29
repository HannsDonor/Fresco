"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Save,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

interface Banner {
  type: "success" | "error";
  text: string;
}

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export default function ProfileManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/profile");
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setError(true);
          return;
        }
        setName(json.admin.name ?? "");
        setUsername(json.admin.username ?? "");
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!banner) return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    if (!trimmedName) {
      setBanner({ type: "error", text: "Full name is required." });
      return;
    }
    if (!trimmedUsername) {
      setBanner({ type: "error", text: "Username is required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setBanner({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setBanner({ type: "error", text: json?.error ?? "Failed to update profile." });
        return;
      }
      setBanner({ type: "success", text: "Profile updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      setBanner({ type: "error", text: "Unable to reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Profile Settings
        </h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Update your name, username, and password. Your current password is required to save
          changes.
        </p>
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
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-500">Loading profile...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium text-slate-600">
            Unable to load your profile. Please try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoading(true);
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserRound className="h-4 w-4 text-brand-500" />
              Account Details
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    className={`${inputClasses} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>
                <div className="relative">
                  <UserRoundCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    maxLength={50}
                    className={`${inputClasses} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <KeyRound className="h-4 w-4 text-brand-500" />
              Change Password
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Leave the new password fields blank to keep your current password.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="profile-current-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Current Password
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-new-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
        </div>
      )}
    </div>
  );
}