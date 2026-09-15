"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WashingMachine, Radar, Phone, Mail, MapPin } from "lucide-react";
import { subscribeLandingRetry } from "@/lib/landingData";

interface Service {
  service_id: number;
  name: string;
}

interface ShopInfo {
  shop_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const navigateLinks = [
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

export default function Footer() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [info, setInfo] = useState<ShopInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFooter() {
      const [servicesRes, shopRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/shop-information"),
      ]);

      const [servicesData, shopData] = await Promise.all([
        servicesRes.json().catch(() => null),
        shopRes.json().catch(() => null),
      ]);

      if (cancelled) return;
      if (servicesData?.success) setServices(servicesData.services ?? null);
      if (shopData?.success) setInfo(shopData.data ?? null);
    }

    loadFooter();
    const unsubscribeRetry = subscribeLandingRetry(() => {
      if (!cancelled) loadFooter();
    });
    return () => {
      cancelled = true;
      unsubscribeRetry();
    };
  }, []);

  return (
    <footer className="bg-brand-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="text-xl font-extrabold tracking-widest text-white">
                FRESCO
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              Smart laundry management for your local laundry shop. Clean,
              organized, reliable.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigate
            </h3>
            <ul className="mt-5 space-y-3">
              {navigateLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-brand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Services
            </h3>
            <ul className="mt-5 space-y-3">
              {services === null ? (
                <>
                  <SkeletonLine className="h-4 w-2/3" />
                  <SkeletonLine className="h-4 w-3/4" />
                  <SkeletonLine className="h-4 w-1/2" />
                </>
              ) : (
                services.map((service) => (
                  <li key={service.service_id}>
                    <Link
                      href={`/book?service_id=${service.service_id}`}
                      className="text-sm text-slate-400 transition-colors hover:text-brand-300"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {info === null ? (
                  <SkeletonLine className="h-4 w-32" />
                ) : (
                  <span className="text-sm text-slate-400">{info.phone}</span>
                )}
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {info === null ? (
                  <SkeletonLine className="h-4 w-40" />
                ) : (
                  <span className="break-all text-sm text-slate-400">
                    {info.email}
                  </span>
                )}
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {info === null ? (
                  <SkeletonLine className="h-8 w-40" />
                ) : (
                  <span className="text-sm leading-relaxed text-slate-400">
                    {info.address}
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © 2026 FRESCO. All rights reserved.
          </p>
          <Link
            href="/tracking"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-brand-300"
          >
            Track My Laundry
            <Radar className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}