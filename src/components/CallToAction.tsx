import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-16 text-center shadow-xl shadow-brand-500/25 sm:px-12 lg:py-24">
          <span
            aria-hidden="true"
            className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-white/10"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready for clean laundry?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-50 sm:text-lg">
              Submit your order today. No account required.
            </p>
            <Link
              href="/book"
              className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50"
            >
              Book a Service Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}