import type { FinanceState } from "./types";

// Initial data — completely clean zeroed out state for production.
export const initialState: FinanceState = {
  hideBalances: false,
  currentMonth: "Jul",
  transactions: [],
  cards: [],
  rules: [],
  budgets: [],
  goals: [],
  faturas: [],
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
