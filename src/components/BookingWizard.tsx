"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  Cloud,
  Clock,
  Home,
  LoaderCircle,
  MapPin,
  Phone,
  Shirt,
  Sparkles,
  User,
  WashingMachine,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { LOAD_TYPES, LOAD_TYPE_LABELS } from "@/lib/constants";

interface Service {
  service_id: number;
  name: string;
  description: string | null;
  starting_price: string | number;
  icon: string | null;
}

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

interface BookingForm {
  name: string;
  phone: string;
  address: string;
  serviceId: number;
  loadType: string;
  instructions: string;
  pickupDate: string;
  pickupTime: string;
}

const STEPS = [
  { number: "01", title: "Customer Info" },
  { number: "02", title: "Laundry Details" },
  { number: "03", title: "Pickup Info" },
  { number: "04", title: "Review" },
];

const STEP_HEADINGS = [
  "Customer Information",
  "Laundry Details",
  "Pickup Information",
  "Review Your Order",
];

const ICONS: Record<string, LucideIcon> = {
  "check-circle": BadgeCheck,
  "circle-check": BadgeCheck,
  cloud: Cloud,
  sparkles: Sparkles,
  wash: WashingMachine,
  droplets: WashingMachine,
  wind: Wind,
  bed: BedDouble,
  shirt: Shirt,
  iron: Shirt,
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

const phoneInputClasses =
  "w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-[5.25rem] pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

const labelClasses = "mb-2 block text-sm font-semibold text-slate-700";

function formatCurrency(value: string | number): string {
  const amount = Number(value);
  const text = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `₱${text}`;
}

function iconForService(service: Service): LucideIcon {
  const key = (service.icon ?? "").toLowerCase();
  if (key && ICONS[key]) return ICONS[key];

  const name = (service.name ?? "").toLowerCase();
  if (/wash.*fold|fold/.test(name)) return WashingMachine;
  if (/dry clean/.test(name)) return Sparkles;
  if (/dry/.test(name)) return Wind;
  if (/iron|press/.test(name)) return Shirt;
  if (/wash/.test(name)) return WashingMachine;
  if (/blanket|bed|quilt/.test(name)) return BedDouble;
  return Shirt;
}

function parseHourLabel(label: string): number {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(label.trim());
  if (!match) return 9 * 60;
  let hour = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3].toUpperCase();
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;
  return hour * 60 + minutes;
}

function toTimeValue(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeValueToLabel(value: string): string {
  const [h, m] = value.split(":");
  let hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return m === "00" ? `${hour} ${period}` : `${hour}:${m} ${period}`;
}

function formatPickupDisplay(date: string, time: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  const dateLabel = parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const [h, m] = time.split(":");
  let hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const timeLabel = m === "00" ? `${hour} ${period}` : `${hour}:${m} ${period}`;
  return `${dateLabel} at ${timeLabel}`;
}

function blurActiveElement() {
  const active = document.activeElement;
  if (active && active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }
}

function phoneCore(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("63")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

function formatPhoneCore(core: string): string {
  if (!core) return "";
  return [core.slice(0, 3), core.slice(3, 6), core.slice(6)].filter(Boolean).join(" ");
}

export default function BookingWizard({ initialServiceId }: { initialServiceId?: number }) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [form, setForm] = useState<BookingForm>({
    name: "",
    phone: "",
    address: "",
    serviceId: initialServiceId ?? 0,
    loadType: "",
    instructions: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [serviceRes, shopRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/shop-information"),
      ]);
      const [serviceData, shopData] = await Promise.all([
        serviceRes.json().catch(() => null),
        shopRes.json().catch(() => null),
      ]);

      if (cancelled) return;

      if (serviceData?.success) {
        const list: Service[] = serviceData.services ?? [];
        setServices(list);
        const preselected = list.some((service) => service.service_id === form.serviceId);
        if (!preselected) {
          setForm((current) => ({ ...current, serviceId: 0 }));
        }
      }
      if (shopData?.success) setShop(shopData.data ?? null);
    }

    loadData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => service.service_id === form.serviceId) ?? null,
    [services, form.serviceId]
  );

  const timeSlots = useMemo(() => {
    if (!form.pickupDate) return [];
    const dayKey = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][new Date(`${form.pickupDate}T00:00:00`).getDay()];

    const hours = shop?.[`${dayKey}_hours` as keyof ShopInfo] as string | null;
    if (!hours) return [];

    let openMinutes = 8 * 60;
    let closeMinutes = 18 * 60;

    const [openLabel, closeLabel] = hours.split("–");
    if (openLabel) openMinutes = parseHourLabel(openLabel.trim());
    if (closeLabel) closeMinutes = parseHourLabel(closeLabel.trim());

    const slots: string[] = [];
    for (let minutes = openMinutes; minutes <= closeMinutes; minutes += 30) {
      slots.push(toTimeValue(minutes));
    }
    return slots;
  }, [form.pickupDate, shop]);

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  }, []);

  function setField(field: keyof BookingForm, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateStep(current: number): boolean {
    const next: Record<string, string> = {};

    if (current === 1) {
      if (!form.name.trim()) next.name = "Please enter your full name.";
      else if (form.name.trim().length > 50)
        next.name = "Full name must be 50 characters or fewer.";
      if (!form.phone.trim()) next.phone = "Please enter your contact number.";
      else if (!/^9[0-9]{9}$/.test(form.phone.trim()))
        next.phone = "Enter a valid Philippine mobile number (+63 9XX XXX XXXX).";
      if (!form.address.trim()) next.address = "Please enter your address.";
    }

    if (current === 2) {
      if (!form.serviceId) next.serviceId = "Please select a service.";
      if (!form.loadType) next.loadType = "Please select a load type.";
    }

    if (current === 3) {
      if (!form.pickupDate) next.pickupDate = "Please choose a pickup date.";
      else if (form.pickupDate < today) next.pickupDate = "Pickup date cannot be in the past.";
      if (!form.pickupTime) next.pickupTime = "Please choose a pickup time.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueStep() {
    blurActiveElement();
    if (validateStep(step)) {
      setStep((value) => Math.min(value + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function backStep() {
    setStep((value) => Math.max(value - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitOrder() {
    setSubmitError(null);
    if (!validateStep(2) || !validateStep(3) || !validateStep(1)) {
      backStep();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() ? `+63${form.phone.trim()}` : "",
          address: form.address.trim(),
          service_id: form.serviceId,
          load_type: form.loadType,
          special_instructions: form.instructions.trim() || null,
          pickup_date: form.pickupDate,
          pickup_time: form.pickupTime,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSubmitError(data?.error ?? "We couldn't submit your request. Please try again.");
        return;
      }

      router.push(`/confirmation?token=${encodeURIComponent(data.tracking_token)}`);
    } catch {
      setSubmitError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !selectedService;

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <header className="border-b border-brand-900/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <WashingMachine className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-widest text-slate-900">
              FRESCO
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Home className="h-[18px] w-[18px]" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-5 py-10 sm:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
              Book a Laundry Service
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {STEP_HEADINGS[step - 1]}
            </h1>
          </div>

          <div className="mt-8 flex items-center gap-2 sm:gap-3">
            {STEPS.map((item, index) => {
              const itemStep = index + 1;
              const active = itemStep === step;
              const complete = itemStep < step;
              return (
                <div key={item.number} className="flex flex-1 items-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                        active
                          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 ring-4 ring-brand-500/15"
                          : complete
                            ? "bg-brand-600 text-white"
                            : "bg-white text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : item.number}
                    </span>
                    <span
                      className={`hidden text-xs font-semibold sm:block ${
                        active ? "text-brand-700" : complete ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  {itemStep < STEPS.length ? (
                    <div
                      className={`h-0.5 flex-1 rounded-full ${
                        itemStep <= step ? "bg-brand-400" : "bg-slate-200"
                      }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-white p-6 shadow-xl shadow-brand-950/5 ring-1 ring-brand-100 sm:p-9 lg:p-10">
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className={labelClasses}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      maxLength={50}
                      placeholder="e.g. Maria Santos"
                      value={form.name}
                      onChange={(event) => setField("name", event.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  {errors.name ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="phone" className={labelClasses}>
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <span className="pointer-events-none absolute left-[2.7rem] top-1/2 -translate-y-1/2 text-[15px] font-semibold text-slate-600">
                      +63
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="917 123 4567"
                      value={formatPhoneCore(form.phone)}
                      onChange={(event) => setField("phone", phoneCore(event.target.value))}
                      className={phoneInputClasses}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.phone}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="address" className={labelClasses}>
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <textarea
                      id="address"
                      rows={3}
                      placeholder="e.g. 123 Rizal Street, Brgy. San Isidro"
                      value={form.address}
                      onChange={(event) => setField("address", event.target.value)}
                      className={`${inputClasses} resize-none py-3.5`}
                    />
                  </div>
                  {errors.address ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.address}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <span className={labelClasses}>
                    Service Type <span className="text-red-500">*</span>
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                      const Icon = iconForService(service);
                      const selected = service.service_id === form.serviceId;
                      return (
                        <button
                          key={service.service_id}
                          type="button"
                          onClick={() => setField("serviceId", service.service_id)}
                          aria-pressed={selected}
                          className={`flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-all ${
                            selected
                              ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500"
                              : "border-transparent bg-slate-50 ring-slate-200 hover:ring-brand-300"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              selected ? "bg-brand-500 text-white" : "bg-white text-brand-500 ring-1 ring-brand-100"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900">
                              {service.name}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">
                              {service.description}
                            </span>
                            <span className="mt-1.5 block text-sm font-bold text-brand-600">
                              From {formatCurrency(service.starting_price)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.serviceId ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.serviceId}</p>
                  ) : null}
                </div>

                <div>
                  <span className={labelClasses}>
                    Load Type <span className="text-red-500">*</span>
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {LOAD_TYPES.map((loadType) => {
                      const selected = form.loadType === loadType;
                      return (
                        <button
                          key={loadType}
                          type="button"
                          onClick={() => setField("loadType", loadType)}
                          aria-pressed={selected}
                          className={`rounded-2xl px-3 py-4 text-center ring-1 transition-all ${
                            selected
                              ? "bg-brand-500 text-white ring-2 ring-brand-500 shadow-lg shadow-brand-500/25"
                              : "bg-slate-50 text-slate-700 ring-slate-200 hover:ring-brand-300"
                          }`}
                        >
                          <span className="block text-base font-extrabold">{loadType}</span>
                          <span
                            className={`mt-1 hidden text-xs font-medium sm:block ${
                              selected ? "text-brand-50" : "text-slate-500"
                            }`}
                          >
                            {LOAD_TYPE_LABELS[loadType]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.loadType ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.loadType}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="instructions" className={labelClasses}>
                    Special Instructions
                  </label>
                  <textarea
                    id="instructions"
                    rows={3}
                    placeholder="e.g. Use unscented detergent, separate delicate clothes..."
                    value={form.instructions}
                    onChange={(event) => setField("instructions", event.target.value)}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="pickupDate" className={labelClasses}>
                    Preferred Pickup Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="pickupDate"
                      type="date"
                      min={today}
                      value={form.pickupDate}
                      onChange={(event) => setField("pickupDate", event.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  {errors.pickupDate ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.pickupDate}</p>
                  ) : null}
                </div>

                <div>
                  <span className={labelClasses}>
                    Preferred Pickup Time <span className="text-red-500">*</span>
                  </span>
                  <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => {
                        const selected = form.pickupTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setField("pickupTime", slot)}
                            aria-pressed={selected}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                              selected
                                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"
                            }`}
                          >
                            {timeValueToLabel(slot)}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-2 text-sm text-slate-500">
                        {form.pickupDate
                          ? "The shop is closed on this day. Please choose another date."
                          : "Choose a pickup date to see available times."}
                      </p>
                    )}
                  </div>
                  {errors.pickupTime ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">{errors.pickupTime}</p>
                  ) : null}
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3.5">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                  <p className="text-sm leading-relaxed text-brand-800">
                    Pickup times are subject to availability. We&apos;ll confirm your preferred
                    time after accepting your order.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-7">
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                    Customer Information
                  </h2>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <ReviewRow label="Name" value={form.name.trim()} />
                    <ReviewRow label="Phone" value={form.phone.trim() ? `+63 ${formatPhoneCore(form.phone.trim())}` : "—"} />
                    <ReviewRow label="Address" value={form.address.trim() || "—"} />
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                    Laundry Details
                  </h2>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <ReviewRow label="Service" value={selectedService?.name ?? "—"} />
                    <ReviewRow
                      label="Load Type"
                      value={form.loadType ? LOAD_TYPE_LABELS[form.loadType as (typeof LOAD_TYPES)[number]] : "—"}
                    />
                    <div className="sm:col-span-2">
                      <ReviewRow
                        label="Special Instructions"
                        value={form.instructions.trim() || "—"}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                    Pickup
                  </h2>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <ReviewRow
                      label="Date & Time"
                      value={
                        form.pickupDate && form.pickupTime
                          ? formatPickupDisplay(form.pickupDate, form.pickupTime)
                          : "—"
                      }
                    />
                  </div>
                </section>

                <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4 ring-1 ring-brand-100">
                  <span className="text-sm font-semibold text-slate-700">Estimated Total</span>
                  <span className="text-2xl font-extrabold text-brand-600">
                    {selectedService ? formatCurrency(selectedService.starting_price) : "—"}
                  </span>
                </div>
                <p className="-mt-4 text-xs text-slate-500">
                  Final amount may be adjusted after weighing your laundry.
                </p>
              </div>
            ) : null}

            {submitError ? (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {submitError}
              </div>
            ) : null}

            <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
              {step === 1 ? (
                <Link
                  href="/"
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800 sm:flex-none"
                >
                  Cancel
                </Link>
              ) : (
                <button
                  type="button"
                  onPointerDown={blurActiveElement}
                  onClick={backStep}
                  className="inline-flex touch-manipulation min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800 sm:flex-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onPointerDown={blurActiveElement}
                  onClick={continueStep}
                  className="inline-flex touch-manipulation min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 sm:flex-none"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onPointerDown={blurActiveElement}
                  onClick={submitOrder}
                  disabled={submitDisabled}
                  className="inline-flex touch-manipulation min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:px-7"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Laundry Request
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-slate-800">{value}</dd>
    </div>
  );
}