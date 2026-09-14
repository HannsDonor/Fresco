import { Droplets } from "lucide-react";

function Bubble({ className }: { className: string }) {
  return (
    <span
      className={`absolute rounded-full bg-white/80 ring-1 ring-brand-100 ${className}`}
    />
  );
}

export default function WashingMachineArt() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
      <Bubble className="left-4 top-10 h-4 w-4" />
      <Bubble className="right-10 top-4 h-2.5 w-2.5" />
      <Bubble className="bottom-16 left-8 h-3 w-3" />
      <Bubble className="left-0 top-1/2 h-2 w-2" />
      <Bubble className="right-2 bottom-24 h-2.5 w-2.5" />

      <div className="relative overflow-visible rounded-[2.5rem] bg-gradient-to-b from-brand-100 via-brand-50 to-brand-100 p-8 shadow-xl shadow-brand-500/10 sm:p-12">
        <div className="mx-auto max-w-[240px]">
          <div className="rounded-[1.75rem] bg-white px-6 pb-7 pt-5 shadow-lg shadow-brand-500/10 ring-1 ring-black/5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <span className="h-2 w-2 rounded-full bg-brand-100" />
                <span className="h-2 w-2 rounded-full bg-brand-200" />
              </div>
              <div className="flex h-7 w-16 items-center justify-between rounded-full bg-brand-50 px-3 ring-1 ring-brand-100">
                <span className="h-2 w-2 rounded-full bg-brand-300" />
                <span className="h-3.5 w-3.5 rounded-full bg-brand-400" />
              </div>
            </div>

            <div className="relative mx-auto flex aspect-square w-[78%] items-center justify-center rounded-full bg-brand-50 ring-[10px] ring-brand-100">
              <Bubble className="left-5 top-5 h-3.5 w-3.5" />
              <Bubble className="bottom-7 left-8 h-2.5 w-2.5" />
              <Bubble className="right-6 top-8 h-3 w-3" />
              <div className="relative flex h-[62%] w-[62%] items-center justify-center rounded-full bg-white shadow-sm">
                <Droplets className="h-9 w-9 text-brand-300" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-1 flex w-2/3 justify-between px-6">
            <span className="h-3 w-3 rounded-b-lg bg-brand-200" />
            <span className="h-3 w-3 rounded-b-lg bg-brand-200" />
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-8 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-lg shadow-slate-900/5 ring-1 ring-black/5 sm:-right-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="text-sm font-semibold text-slate-800">Order Ready!</span>
      </div>

      <div className="absolute -left-2 bottom-6 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-lg shadow-slate-900/5 ring-1 ring-black/5 sm:-left-6">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100" />
        <span className="text-sm font-semibold text-slate-800">Real-time Tracking</span>
      </div>
    </div>
  );
}