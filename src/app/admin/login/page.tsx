import Link from "next/link";
import { redirect } from "next/navigation";
import { WashingMachine, ChevronLeft } from "lucide-react";
import AdminLoginForm from "@/components/AdminLoginForm";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Admin Login | Fresco",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50 text-slate-900">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-brand-500/10 ring-1 ring-black/5 sm:p-10">
            <div className="mb-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-md">
                <WashingMachine className="h-7 w-7" strokeWidth={2.2} />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                Admin Login
              </h1>
              <p className="mt-2 text-[15px] text-slate-500">
                Sign in to manage your laundry shop
              </p>
            </div>

            <AdminLoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}