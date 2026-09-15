import {
  BadgeCheck,
  BedDouble,
  Cloud,
  Droplets,
  Shirt,
  Sparkles,
  WashingMachine,
  Wind,
  type LucideIcon,
} from "lucide-react";

const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  "check-circle": BadgeCheck,
  "circle-check": BadgeCheck,
  cloud: Cloud,
  sparkles: Sparkles,
  wash: WashingMachine,
  droplets: Droplets,
  wind: Wind,
  bed: BedDouble,
  shirt: Shirt,
  iron: Shirt,
};

export function ServiceIconGlyph({ icon, className }: { icon: string | null; className?: string }) {
  if (!icon) return null;
  const Icon = SERVICE_ICON_MAP[icon.toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={2} />;
}