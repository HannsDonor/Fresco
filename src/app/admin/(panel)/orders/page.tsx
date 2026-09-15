import type { Metadata } from "next";
import OrdersManager from "@/components/admin/OrdersManager";

export const metadata: Metadata = {
  title: "Orders | Fresco",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderId = params?.order ? Number(params.order) : undefined;
  return (
    <OrdersManager
      initialOrderId={Number.isInteger(orderId) && orderId! > 0 ? orderId : undefined}
    />
  );
}