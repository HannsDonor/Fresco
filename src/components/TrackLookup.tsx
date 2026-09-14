"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Radar, WashingMachine, LoaderCircle } from "lucide-react";

export default function TrackLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const token = value.trim().toUpperCase();
    if (!token) {
      setError("Please enter your tracking ID.");
      return;
    }

    const normalized = /^TRK-[A-Z0-9]+$/.test(token)
      ? token
      : token.startsWith("TRK")
        ? token
        : `TRK-${token}`;

    setSubmitting(true);
    router.push(`/track/${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
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

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-[1.75rem] bg-white p-8 text-center shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
              <Radar className="h-8 w-8" />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
              Track My Laundry
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Enter the tracking ID from your booking to see your laundry&apos;s current
              status. No account required.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="e.g. TRK-VJ7RW2"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-lg font-bold text-slate-900 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              />
              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Radar className="h-5 w-5" />
                )}
                Track My Laundry
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}