"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WashingMachine,
  Droplets,
  Sparkles,
  Wind,
  BedDouble,
  Shirt,
  BadgeCheck,
  Cloud,
  type LucideIcon,
} from "lucide-react";

interface Service {
  service_id: number;
  name: string;
  description: string | null;
  starting_price: string | number;
  icon: string | null;
}

function iconForService(service: Pick<Service, "name" | "icon">): LucideIcon {
  const iconByKey: Record<string, LucideIcon> = {
    "check-circle": BadgeCheck,
    "circle-check": BadgeCheck,
    cloud: Cloud,
    sparkles: Sparkles,
    wash: WashingMachine,
    droplets: Droplets,
    wind: Wind,
    bed: BedDouble,
    shirt: Shirt,
    iron: Shirt,
  };
  const iconKey = (service.icon ?? "").toLowerCase();
  if (iconKey && iconByKey[iconKey]) return iconByKey[iconKey];

  const name = (service.name ?? "").toLowerCase();
  if (/wash.*fold|fold/.test(name)) return WashingMachine;
  if (/dry clean/.test(name)) return Sparkles;
  if (/dry/.test(name)) return Wind;
  if (/iron|press/.test(name)) return Shirt;
  if (/wash/.test(name)) return Droplets;
  if (/blanket|bed|quilt/.test(name)) return BedDouble;
  return Shirt;
}

function formatPrice(price: string | number): string {
  const value = Number(price);
  const amount = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `₱${amount}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-brand-50/70 p-6 ring-1 ring-brand-100">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-brand-100" />
      <div className="mt-5 h-5 w-3/4 animate-pulse rounded-md bg-brand-100" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-brand-100" />
        <div className="h-3.5 w-5/6 animate-pulse rounded bg-brand-100" />
      </div>
      <div className="mt-7 flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-brand-100" />
        <div className="h-10 w-20 animate-pulse rounded-xl bg-brand-100" />
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json().catch(() => null);

        if (cancelled) return;
        if (!response.ok || !data?.success) {
          setError(true);
          return;
        }
        setServices(data.services ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
            Our Services
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything your laundry needs
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            Professional laundry care for every type of garment — handled with
            attention and delivered with care.
          </p>
        </div>

        {loading ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-14 rounded-3xl bg-brand-50/70 px-6 py-16 text-center ring-1 ring-brand-100">
            <p className="text-base font-medium text-slate-600">
              Unable to load services at the moment.
            </p>
          </div>
        ) : services.length === 0 ? (
          <div className="mt-14 rounded-3xl bg-brand-50/70 px-6 py-16 text-center ring-1 ring-brand-100">
            <p className="text-base font-medium text-slate-600">
              No services are currently available.
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = iconForService(service);
              return (
                <div
                  key={service.service_id}
                  className="flex h-full flex-col rounded-3xl bg-brand-50/70 p-6 shadow-sm ring-1 ring-brand-100 transition-shadow hover:shadow-lg hover:shadow-brand-500/10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100">
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {service.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                    {service.description}
                  </p>

                  <div className="mt-7 flex items-center justify-between gap-3">
                    <span className="text-[15px] font-bold text-slate-900">
                      From {formatPrice(service.starting_price)}
                    </span>
                    <Link
                      href={`/book?service_id=${service.service_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}