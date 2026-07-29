import type { FinanceState } from "./types";

// Initial data — zeroed out clean state for testing from scratch.
export const initialState: FinanceState = {
  hideBalances: false,
  currentMonth: "Jul",
  transactions: [],
  cards: [
    { id: "c1", name: "Cartão Black", bank: "Inter", color: "var(--card)", limit: 15000, current: 0, closing: "12/Jul", due: "20/Jul", bestDay: "13/Jul" },
    { id: "c2", name: "Platinum", bank: "Nubank", color: "var(--chart-5)", limit: 2000, current: 0, closing: "05/Jul", due: "12/Jul", bestDay: "06/Jul" },
    { id: "c3", name: "Visa Infinite", bank: "XP", color: "var(--popover)", limit: 8000, current: 0, closing: "25/Jul", due: "05/Ago", bestDay: "26/Jul" },
  ],
  rules: [],
  budgets: [
    { id: "b1", cat: "Alimentação", limite: 0, iconName: "Utensils", cor: "var(--primary)" },
    { id: "b2", cat: "Transporte", limite: 0, iconName: "Car", cor: "var(--chart-2)" },
    { id: "b3", cat: "Lazer", limite: 0, iconName: "ShoppingCart", cor: "var(--destructive)" },
    { id: "b4", cat: "Moradia", limite: 0, iconName: "Home", cor: "var(--chart-4)" },
  ],
  goals: [
    { id: "g1", label: "Viagem Europa", atual: 0, total: 18000, cor: "var(--primary)", deadline: "Dez 2025" },
    { id: "g2", label: "Fundo Emergência", atual: 0, total: 40000, cor: "var(--chart-2)", deadline: "Mar 2025" },
    { id: "g3", label: "MacBook Pro", atual: 0, total: 12000, cor: "var(--chart-5)", deadline: "Set 2025" },
  ],
};

// Ordered month timeline used across the app.
export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Categories offered in forms, with their bucket + icon.
export const CATEGORIES: { name: string; bucket: "fixo" | "variavel"; iconName: string }[] = [
  { name: "Moradia", bucket: "fixo", iconName: "Home" },
  { name: "Alimentação", bucket: "variavel", iconName: "ShoppingCart" },
  { name: "Transporte", bucket: "variavel", iconName: "Car" },
  { name: "Lazer", bucket: "variavel", iconName: "Utensils" },
  { name: "Assinaturas", bucket: "fixo", iconName: "Wifi" },
  { name: "Renda", bucket: "fixo", iconName: "TrendingUp" },
  { name: "Renda Extra", bucket: "variavel", iconName: "TrendingUp" },
];

// Historical monthly cashflow for the dashboard chart (income/expense per month).
export const CASHFLOW = [
  { month: "Jan", receitas: 0, despesas: 0 },
  { month: "Fev", receitas: 0, despesas: 0 },
  { month: "Mar", receitas: 0, despesas: 0 },
  { month: "Abr", receitas: 0, despesas: 0 },
  { month: "Mai", receitas: 0, despesas: 0 },
  { month: "Jun", receitas: 0, despesas: 0 },
  { month: "Jul", receitas: 0, despesas: 0 },
  { month: "Ago", receitas: 0, despesas: 0 },
  { month: "Set", receitas: 0, despesas: 0 },
  { month: "Out", receitas: 0, despesas: 0 },
  { month: "Nov", receitas: 0, despesas: 0 },
  { month: "Dez", receitas: 0, despesas: 0 },
];
