import type { Metadata } from "next";
import TrackLookup from "@/components/TrackLookup";

export const metadata: Metadata = {
  title: "Track My Laundry | Fresco",
  description:
    "Enter your tracking ID to see your laundry order's status anytime — no account required.",
};

export default function TrackingPage() {
  return <TrackLookup />;
}