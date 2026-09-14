import type { Metadata } from "next";
import OrderTracking from "@/components/OrderTracking";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Track ${token} | Fresco`,
    description: "Track your FRESCO laundry order status anytime — no account required.",
  };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OrderTracking token={token} />;
}