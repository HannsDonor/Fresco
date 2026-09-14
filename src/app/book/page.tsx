import type { Metadata } from "next";
import BookingWizard from "@/components/BookingWizard";

export const metadata: Metadata = {
  title: "Book a Laundry Service | Fresco",
  description:
    "Book a laundry service online — no account required. Choose a service, pick a pickup time, and get a unique tracking ID.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service_id?: string }>;
}) {
  const params = await searchParams;
  const serviceId = params?.service_id ? Number(params.service_id) : undefined;
  return (
    <BookingWizard
      initialServiceId={Number.isInteger(serviceId) && serviceId! > 0 ? serviceId : undefined}
    />
  );
}