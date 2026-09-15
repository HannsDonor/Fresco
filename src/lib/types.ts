export interface AdminOrderRow {
  order_id: number;
  order_reference: string;
  tracking_token: string;
  service_id: number;
  item_count: number;
  estimated_weight: string | null;
  load_type: string;
  special_instructions: string | null;
  pickup_date: string;
  pickup_time: string;
  order_status: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  total_paid: string;
  payment_status: string | null;
  payment_method: string | null;
}

export interface PaymentRecord {
  payment_id: number;
  order_id: number;
  amount: string;
  payment_method: string;
  payment_status: string;
  payment_date: string | null;
}

export interface AdminPaymentRow extends PaymentRecord {
  created_at: string;
  order_reference: string;
  customer_name: string;
}

export interface TimelineEntry {
  status_id: number;
  order_id: number;
  status: string;
  note: string | null;
  updated_at: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  customer_email: string | null;
  customer_address: string | null;
  service_description: string | null;
  service_starting_price: string;
  payments: PaymentRecord[];
  timeline: TimelineEntry[];
}

export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardSummary {
  total: number;
  pending: number;
  active: number;
  readyForPickup: number;
  completed: number;
  cancelled: number;
  todayOrders: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  statusCounts: DashboardStatusCount[];
  recentOrders: AdminOrderRow[];
  todayPickups: AdminOrderRow[];
}

export interface AdminServiceRow {
  service_id: number;
  name: string;
  description: string | null;
  starting_price: string;
  icon: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  order_count: number;
}

import type { ShopDay } from "@/lib/constants";

export interface ShopHoursDay {
  open: string;
  close: string;
}

export interface AdminShopInfo {
  shop_id: number;
  shop_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  hours: Record<ShopDay, ShopHoursDay>;
}