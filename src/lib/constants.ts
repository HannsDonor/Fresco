export const LAUNDRY_STATUSES = [
  "Pending",
  "Accepted",
  "Washing",
  "Drying",
  "Folding",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

export type LaundryStatus = (typeof LAUNDRY_STATUSES)[number];

export const LOAD_TYPES = ["Small", "Medium", "Large"] as const;

export type LoadType = (typeof LOAD_TYPES)[number];

export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  Small: "Small Load (1–3 kg)",
  Medium: "Medium Load (4–6 kg)",
  Large: "Large Load (7+ kg)",
};

export const PAYMENT_METHODS = ["Cash", "GCash"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["Unpaid", "Paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];