export const LAUNDRY_STATUSES = [
  "Pending",
  "Accepted",
  "In Progress",
  "Ready for Pickup",
  "Ready for Delivery",
  "Completed",
  "Delivered",
  "Cancelled",
  "Rejected",
] as const;

export type LaundryStatus = (typeof LAUNDRY_STATUSES)[number];

export const LOAD_TYPES = ["Small", "Medium", "Large"] as const;

export type LoadType = (typeof LOAD_TYPES)[number];

export const FULFILLMENT_METHODS = ["Pickup", "Pickup & Deliver"] as const;

export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  [FULFILLMENT_METHODS[0]]: "Collect your laundry at the shop",
  [FULFILLMENT_METHODS[1]]: "We collect and return it to you",
};

export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  Small: "Small Load (1–3 kg)",
  Medium: "Medium Load (4–6 kg)",
  Large: "Large Load (7+ kg)",
};

export const PAYMENT_METHODS = ["Cash", "GCash"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Pay the delivery rider in cash",
  GCash: "Send payment via GCash",
};

export const DEFAULT_GCASH_NUMBER = "09XX XXX XXXX";

export const DEFAULT_GCASH_QR_IMAGE = "/images/gcash/qrcode.png";

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

export const TRACKING_TOKEN_STORAGE_KEY = "frescoTrackingToken";
