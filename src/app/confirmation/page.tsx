import type { Metadata } from "next";
import OrderConfirmation from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Booking Confirmed | Fresco",
  description:
    "Your laundry request has been submitted. Keep your tracking ID to monitor your order.",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token ?? "";
  return <OrderConfirmation token={token} />;
}