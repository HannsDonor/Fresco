"use client";

import { useState } from "react";
import Link from "next/link";
import { WashingMachine, Radar, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/5 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-extrabold tracking-widest text-slate-900">
            FRESCO
          </span>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          <Link
            href="/tracking"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-800 transition-colors hover:text-brand-600"
          >
            <Radar className="h-[18px] w-[18px]" />
            Track My Laundry
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Admin Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-5 pb-6 pt-3 lg:hidden">
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="mb-3 flex w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25"
          >
            Book a Laundry Service
          </Link>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 transition-colors hover:bg-brand-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
            <Link
              href="/tracking"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700"
            >
              <Radar className="h-[18px] w-[18px]" />
              Track My Laundry
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Admin Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}