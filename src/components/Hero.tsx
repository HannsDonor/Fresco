import Link from "next/link";
import { Plus, Radar } from "lucide-react";
import WashingMachineArt from "./WashingMachineArt";

export default function Hero() {
  return (
    <section className="bg-brand-50">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-sm font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Smart Laundry Management
          </span>

          <h1 className="mt-6 text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
            Laundry
            <br />
            <span className="text-brand-500">Made Simple.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">
            Book your laundry service, track its progress in real time, and pick
            it up when it&apos;s ready — no account needed.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/book"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 sm:w-auto"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              Book a Laundry Service
            </Link>
            <Link
              href="/tracking"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-800 transition-colors hover:border-brand-300 hover:text-brand-700 sm:w-auto"
            >
              <Radar className="h-5 w-5" />
              Track My Laundry
            </Link>
          </div>
        </div>

        <WashingMachineArt />
      </div>
    </section>
  );
}