"use client";

import { useEffect, useState } from "react";
import { Clock, Phone, Mail, MapPin, Navigation } from "lucide-react";

interface ShopInfo {
  shop_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  monday_hours: string | null;
  tuesday_hours: string | null;
  wednesday_hours: string | null;
  thursday_hours: string | null;
  friday_hours: string | null;
  saturday_hours: string | null;
  sunday_hours: string | null;
}

const weekdays = [
  "monday_hours",
  "tuesday_hours",
  "wednesday_hours",
  "thursday_hours",
  "friday_hours",
] as const;

function operatingHours(info: ShopInfo): [string, string][] {
  const days = weekdays.map((day) => info[day]);
  const allSame = days.every((hours) => hours && hours === days[0]);

  if (allSame) {
    return [
      ["Monday – Friday", days[0] ?? ""],
      ["Saturday", info.saturday_hours ?? ""],
      ["Sunday", info.sunday_hours ?? ""],
    ];
  }

  return [
    ["Monday", info.monday_hours ?? ""],
    ["Tuesday", info.tuesday_hours ?? ""],
    ["Wednesday", info.wednesday_hours ?? ""],
    ["Thursday", info.thursday_hours ?? ""],
    ["Friday", info.friday_hours ?? ""],
    ["Saturday", info.saturday_hours ?? ""],
    ["Sunday", info.sunday_hours ?? ""],
  ];
}

function CardSkeleton() {
  return (
    <div className="rounded-3xl bg-brand-50/70 p-7 ring-1 ring-brand-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-brand-100" />
        <div className="h-5 w-32 animate-pulse rounded-md bg-brand-100" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-brand-100" />
      </div>
    </div>
  );
}

const mapGridStyle = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(13,95,138,0.10) 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, rgba(13,95,138,0.10) 0 1px, transparent 1px 26px)",
};

export default function ShopInformation() {
  const [info, setInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadShop() {
      try {
        const response = await fetch("/api/shop-information");
        const data = await response.json().catch(() => null);

        if (cancelled) return;
        if (!response.ok || !data?.success) {
          setError(true);
          return;
        }
        setInfo(data.data ?? null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadShop();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="contact" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
            Find Us
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Shop Information
          </h2>
        </div>

        {loading ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error || !info ? (
          <div className="mt-14 rounded-3xl bg-brand-50/70 px-6 py-16 text-center ring-1 ring-brand-100">
            <p className="text-base font-medium text-slate-600">
              Unable to load shop information.
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl bg-brand-50/70 p-7 shadow-sm ring-1 ring-brand-100">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100">
                  <Clock className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Operating Hours
                </h3>
              </div>
              <dl className="mt-6 space-y-3">
                {operatingHours(info).map(([label, hours]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-brand-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-sm font-medium text-slate-600">
                      {label}
                    </dt>
                    <dd className="text-right text-sm font-semibold text-slate-900">
                      {hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-3xl bg-brand-50/70 p-7 shadow-sm ring-1 ring-brand-100">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100">
                  <Phone className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Contact Us</h3>
              </div>
              <ul className="mt-6 space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 ring-1 ring-brand-100">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phone
                    </span>
                    <a
                      href={`tel:${info.phone ?? ""}`}
                      className="mt-0.5 block text-sm font-semibold text-slate-900 transition-colors hover:text-brand-600"
                    >
                      {info.phone}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 ring-1 ring-brand-100">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email
                    </span>
                    <a
                      href={`mailto:${info.email ?? ""}`}
                      className="mt-0.5 block text-sm font-semibold break-all text-slate-900 transition-colors hover:text-brand-600"
                    >
                      {info.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 ring-1 ring-brand-100">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Address
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                      {info.address}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-brand-50/70 p-7 shadow-sm ring-1 ring-brand-100">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100">
                  <Navigation className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Location</h3>
              </div>
              <div
                className="relative mt-6 h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 ring-1 ring-brand-100"
                style={mapGridStyle}
              >
                <span className="absolute left-[58%] top-[30%] h-2 w-2 rounded-full bg-brand-300" />
                <span className="absolute left-[20%] bottom-[38%] h-2 w-2 rounded-full bg-brand-300" />
                <span
                  className="absolute left-[58%] top-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/40"
                  style={{ height: 52, width: 52 }}
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg">
                    <MapPin className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {info.address}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}