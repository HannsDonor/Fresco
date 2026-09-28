import type { Metadata } from "next";
import OrdersManager from "@/components/admin/OrdersManager";

export const metadata: Metadata = {
  title: "Orders | Fresco",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
    q?: string;
    status?: string;
    date?: string;
    payment?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const orderId = params?.order ? Number(params.order) : undefined;
  return (
    <OrdersManager
      key={JSON.stringify({
        q: params?.q ?? "",
        status: params?.status ?? "",
        date: params?.date ?? "",
        payment: params?.payment ?? "",
        from: params?.from ?? "",
        to: params?.to ?? "",
      })}
      initialOrderId={Number.isInteger(orderId) && orderId! > 0 ? orderId : undefined}
      initialQ={params?.q ?? ""}
      initialStatus={params?.status ?? ""}
      initialDate={params?.date ?? ""}
      initialPayment={params?.payment ?? ""}
      initialFrom={params?.from ?? ""}
      initialTo={params?.to ?? ""}
    />
  );
}