import { statusColor, paymentBadge } from "@/lib/status";

export default function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${color.badge}`}
    >
      {status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string | null }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${paymentBadge(status)}`}
    >
      {status ?? "—"}
    </span>
  );
}