import type { FinanceState } from "./types";

// Initial data — migrated from the old module-level constants in App.tsx.
export const initialState: FinanceState = {
  hideBalances: false,
  currentMonth: "Jul",
  transactions: [
    { id: "t1", desc: "Salário", cat: "Renda", month: "Jul", date: "08 Jul", value: 11400, type: "in", bucket: "fixo", card: "Pix" },
    { id: "t2", desc: "Aluguel", cat: "Moradia", month: "Jul", date: "05 Jul", value: -2100, type: "out", bucket: "fixo", card: "Pix" },
    { id: "t3", desc: "Mercado Extra", cat: "Alimentação", month: "Jul", date: "04 Jul", value: -487, type: "out", bucket: "variavel", card: "Inter" },
    { id: "t4", desc: "Spotify + Netflix", cat: "Assinaturas", month: "Jul", date: "03 Jul", value: -89, type: "out", bucket: "fixo", card: "Nubank" },
    { id: "t5", desc: "Freelance Design", cat: "Renda Extra", month: "Jul", date: "02 Jul", value: 2200, type: "in", bucket: "variavel", card: "Pix" },
    { id: "t6", desc: "Combustível", cat: "Transporte", month: "Jul", date: "01 Jul", value: -320, type: "out", bucket: "variavel", card: "Inter" },
    { id: "t7", desc: "Restaurante Fogo", cat: "Alimentação", month: "Jun", date: "30 Jun", value: -210, type: "out", bucket: "variavel", card: "Nubank" },
    { id: "t8", desc: "Salário", cat: "Renda", month: "Jun", date: "08 Jun", value: 10200, type: "in", bucket: "fixo", card: "Pix" },
    { id: "t9", desc: "Aluguel", cat: "Moradia", month: "Jun", date: "05 Jun", value: -2100, type: "out", bucket: "fixo", card: "Pix" },
    { id: "t10", desc: "Supermercado", cat: "Alimentação", month: "Jun", date: "12 Jun", value: -640, type: "out", bucket: "variavel", card: "Inter" },
  ],
  cards: [
    { id: "c1", name: "Cartão Black", bank: "Inter", color: "var(--card)", limit: 15000, current: 3850, closing: "12/Jul", due: "20/Jul", bestDay: "13/Jul" },
    { id: "c2", name: "Platinum", bank: "Nubank", color: "var(--chart-5)", limit: 2000, current: 450, closing: "05/Jul", due: "12/Jul", bestDay: "06/Jul" },
    { id: "c3", name: "Visa Infinite", bank: "XP", color: "var(--popover)", limit: 8000, current: 1200, closing: "25/Jul", due: "05/Ago", bestDay: "26/Jul" },
  ],
  rules: [],
  budgets: [
    { id: "b1", cat: "Alimentação", limite: 1600, iconName: "Utensils", cor: "var(--primary)" },
    { id: "b2", cat: "Transporte", limite: 900, iconName: "Car", cor: "var(--chart-2)" },
    { id: "b3", cat: "Lazer", limite: 500, iconName: "ShoppingCart", cor: "var(--destructive)" },
    { id: "b4", cat: "Moradia", limite: 2100, iconName: "Home", cor: "var(--chart-4)" },
  ],
  goals: [
    { id: "g1", label: "Viagem Europa", atual: 12400, total: 18000, cor: "var(--primary)", deadline: "Dez 2025" },
    { id: "g2", label: "Fundo Emergência", atual: 34000, total: 40000, cor: "var(--chart-2)", deadline: "Mar 2025" },
    { id: "g3", label: "MacBook Pro", atual: 5600, total: 12000, cor: "var(--chart-5)", deadline: "Set 2025" },
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
  { month: "Jan", receitas: 8200, despesas: 5100 },
  { month: "Fev", receitas: 8800, despesas: 6200 },
  { month: "Mar", receitas: 7900, despesas: 4800 },
  { month: "Abr", receitas: 9400, despesas: 5600 },
  { month: "Mai", receitas: 9100, despesas: 6800 },
  { month: "Jun", receitas: 10200, despesas: 5900 },
  { month: "Jul", receitas: 11400, despesas: 6100 },
  { month: "Ago", receitas: 0, despesas: 0 },
  { month: "Set", receitas: 0, despesas: 0 },
  { month: "Out", receitas: 0, despesas: 0 },
  { month: "Nov", receitas: 0, despesas: 0 },
  { month: "Dez", receitas: 0, despesas: 0 },
];
