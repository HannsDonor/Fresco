import { LayoutDashboard } from "lucide-react";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = {
  title: "Dashboard | Fresco",
};

export default function AdminDashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="Dashboard"
      description="The Admin/Owner dashboard is coming soon. Manage laundry orders, update statuses, record payments, and plan pickup schedules."
    />
  );
}