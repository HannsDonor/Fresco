export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  const amount = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  return `₱${amount}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const text = typeof value === "string" ? value : value.toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const text = typeof value === "string" ? value : value.toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "string" ? value : value.toISOString();
  const match = /(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return "—";
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}