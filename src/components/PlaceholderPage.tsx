import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Home } from "lucide-react";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      <header className="border-b border-slate-900/5 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-700 transition-colors hover:text-brand-600"
          >
            <Home className="h-[18px] w-[18px]" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center bg-brand-50 px-5 py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-500 shadow-md ring-1 ring-black/5">
            <Icon className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </main>
    </div>
  );
}