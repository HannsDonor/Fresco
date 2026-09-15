export const LAUNDRY_STATUSES = [
  "Pending",
  "Accepted",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
  "Rejected",
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

export const SERVICE_ICONS = [
  "check-circle",
  "cloud",
  "sparkles",
  "wash",
  "droplets",
  "wind",
  "bed",
  "shirt",
  "iron",
] as const;

export const SHOP_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type ShopDay = (typeof SHOP_DAYS)[number];

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];