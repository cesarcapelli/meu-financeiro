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
};

export function iconFor(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || Wallet;
}
