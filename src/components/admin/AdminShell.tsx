"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ClipboardList,
  Filter,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shirt,
  Store,
  Wallet,
  WashingMachine,
  X,
  type LucideIcon,
} from "lucide-react";
import { LAUNDRY_STATUSES } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/payments", label: "Payments", icon: Wallet, exact: false },
  { href: "/admin/services", label: "Services", icon: Shirt, exact: false },
  { href: "/admin/shop-information", label: "Shop Info", icon: Store, exact: false },
];

function OrderSearchBox({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [date, setDate] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    const trimmed = text.trim();
    if (trimmed) params.set("q", trimmed);
    if (status !== "all") params.set("status", status);
    if (payment !== "all") params.set("payment", payment);
    if (date !== "all") params.set("date", date);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    onNavigate();
    router.push(`/admin/orders${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  const smallSelectClasses =
    "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] font-semibold text-slate-600 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-brand-50/70 p-3 ring-1 ring-brand-100">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
        Order History
      </p>
      <div className="relative mt-2.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reference, customer, phone..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
        />
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen((value) => !value)}
        className="mt-2.5 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[13px] font-semibold text-slate-600 transition-colors hover:text-brand-700"
        aria-expanded={filtersOpen}
      >
        <span className="inline-flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
        />
      </button>

      {filtersOpen ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={smallSelectClasses}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {LAUNDRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={payment}
            onChange={(event) => setPayment(event.target.value)}
            className={smallSelectClasses}
            aria-label="Filter by payment"
          >
            <option value="all">Paid / Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={smallSelectClasses}
            aria-label="Filter by pickup date"
          >
            <option value="all">All Dates</option>
            <option value="today">Today&apos;s Orders</option>
            <option value="upcoming">Upcoming Pickup</option>
          </select>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={smallSelectClasses}
            aria-label="Pickup date from"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={smallSelectClasses}
            aria-label="Pickup date to"
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-2.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
        </div>
      ) : (
        <button
          type="submit"
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      )}
    </form>
  );
}

export default function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(item: NavItem): boolean {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-dvh bg-brand-50/50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-slate-100 px-5">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <OrderSearchBox onNavigate={() => setOpen(false)} />

          <nav className="mt-5 space-y-1">
            {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors ${
                  active
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <item.icon className="h-5 w-5" strokeWidth={2.1} />
                {item.label}
              </Link>
            );
          })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-slate-100 p-3">
          <div className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5">
            <span className="truncate text-sm font-bold text-slate-700">
              {adminName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Home className="h-5 w-5" strokeWidth={2.1} />
            Back to Home
          </Link>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-lg font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}