import {
  TrendingUp,
  Home,
  ShoppingCart,
  Wifi,
  Car,
  Utensils,
  CreditCard,
  Wallet,
  Target,
  Plane,
  Laptop,
  PiggyBank,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Tag,
  Bus,
  Film,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Central registry so we can persist an icon by name in the store.
export const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  Home,
  ShoppingCart,
  Wifi,
  Car,
  Utensils,
  CreditCard,
  Wallet,
  Target,
  Plane,
  Laptop,
  PiggyBank,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Tag,
  Bus,
  Film,
  UserCheck,
  Zap,
};

export function iconFor(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || Wallet;
}

