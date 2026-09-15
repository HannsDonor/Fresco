import type { Metadata } from "next";
import ShopInfoManager from "@/components/admin/ShopInfoManager";

export const metadata: Metadata = {
  title: "Shop Information | Fresco",
};

export default function AdminShopInfoPage() {
  return <ShopInfoManager />;
}