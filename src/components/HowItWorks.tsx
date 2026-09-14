const steps = [
  {
    number: "01",
    title: "Submit Your Order",
    description:
      "Fill out the booking form with your laundry details and preferred pickup time.",
  },
  {
    number: "02",
    title: "Laundry is Processed",
    description:
      "Our team accepts your order and begins the cleaning process right away.",
  },
  {
    number: "03",
    title: "Track Your Laundry",
    description:
      "Use your unique tracking link to monitor your order in real time.",
  },
  {
    number: "04",
    title: "Pick Up When Ready",
    description:
      "We'll notify you when your laundry is clean and ready for pickup.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-brand-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
            Process
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            How It Works
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            Four simple steps to clean, fresh laundry.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-7 hidden border-t-2 border-dashed border-brand-300 lg:block"
          />
          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step) => (
              <li
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-brand-500 shadow-md ring-1 ring-brand-100">
                  {step.number}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}