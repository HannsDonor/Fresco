import type { Metadata } from "next";
import ProfileManager from "@/components/admin/ProfileManager";

export const metadata: Metadata = {
  title: "Profile | Fresco",
};

export default function AdminProfilePage() {
  return <ProfileManager />;
}