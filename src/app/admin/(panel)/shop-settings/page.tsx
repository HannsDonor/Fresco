import type { Metadata } from "next";
import ShopSettingsManager from "@/components/admin/ShopSettingsManager";

export const metadata: Metadata = {
  title: "Shop Settings | Fresco",
};

export default function AdminShopSettingsPage() {
  return <ShopSettingsManager />;
}
