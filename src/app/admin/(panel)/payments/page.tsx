import type { Metadata } from "next";
import PaymentsManager from "@/components/admin/PaymentsManager";

export const metadata: Metadata = {
  title: "Payments | Fresco",
};

export default function AdminPaymentsPage() {
  return <PaymentsManager />;
}