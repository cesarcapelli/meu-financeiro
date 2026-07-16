import type { FinanceState, Transaction } from "./types";
import { CASHFLOW, MONTHS } from "./seed";

export function txForMonth(state: FinanceState, month: string): Transaction[] {
  return state.transactions.filter((t) => t.month === month);
}

export function getMonthSummary(state: FinanceState, month: string) {
  const tx = txForMonth(state, month);
  const receitas = tx.filter((t) => t.type === "in").reduce((s, t) => s + t.value, 0);
  const despesas = tx.filter((t) => t.type === "out").reduce((s, t) => s + Math.abs(t.value), 0);
  
  // Saldo considers only 'Pix' (cash) outflows. Credit card outflows don't leave checking account yet.
  const despesas_pix = tx.filter((t) => t.type === "out" && t.card === "Pix").reduce((s, t) => s + Math.abs(t.value), 0);
  
  return { receitas, despesas, saldo: receitas - despesas_pix };
}

// Two-category split (Fixos vs Variáveis) of expenses for the given month.
export function getSpendingByCategory(state: FinanceState, month: string) {
  const tx = txForMonth(state, month).filter((t) => t.type === "out");
  const fixo = tx.filter((t) => t.bucket === "fixo").reduce((s, t) => s + Math.abs(t.value), 0);
  const variavel = tx.filter((t) => t.bucket === "variavel").reduce((s, t) => s + Math.abs(t.value), 0);
  return [
    { name: "Gastos Fixos", value: fixo, color: "var(--chart-2)" },
    { name: "Gastos Variáveis", value: variavel, color: "var(--chart-4)" },
  ];
}

// Cashflow series: historical months + live totals for months that have tx data, and future month forecasts.
export function getCashflowSeries(state: FinanceState) {
  const currentMonthIdx = MONTHS.indexOf(state.currentMonth);

  // Calculate fixed expenses and fixed incomes of the current month
  const currentMonthTx = txForMonth(state, state.currentMonth);
  const fixedIncomes = currentMonthTx
    .filter((t) => t.type === "in" && t.bucket === "fixo")
    .reduce((s, t) => s + t.value, 0);
  const fixedExpenses = currentMonthTx
    .filter((t) => t.type === "out" && t.bucket === "fixo")
    .reduce((s, t) => s + Math.abs(t.value), 0);

  return MONTHS.map((m, idx) => {
    if (idx <= currentMonthIdx) {
      // Past or present month: use live totals if there are transactions, else fall back to CASHFLOW seed
      const live = getMonthSummary(state, m);
      const hasLive = txForMonth(state, m).length > 0;
      if (hasLive) {
        return { month: m, receitas: live.receitas, despesas: live.despesas };
      } else {
        const seedRow = CASHFLOW.find((r) => r.month === m);
        return seedRow
          ? { month: m, receitas: seedRow.receitas, despesas: seedRow.despesas }
          : { month: m, receitas: 0, despesas: 0 };
      }
    } else {
      // Future month: project fixed income and expenses, adding any actual future transactions (like credit card installments)
      const live = getMonthSummary(state, m);
      return {
        month: m,
        receitas: live.receitas + fixedIncomes,
        despesas: live.despesas + fixedExpenses,
      };
    }
  });
}

// Month-over-month expense comparison for the insight card.
export function getExpenseTrend(state: FinanceState, month: string) {
  const idx = MONTHS.indexOf(month);
  const prev = idx > 0 ? MONTHS[idx - 1] : null;
  const cur = getMonthSummary(state, month).despesas;
  if (!prev) return { pct: 0, prevMonth: null as string | null, cur };
  const prevVal = getMonthSummary(state, prev).despesas;
  if (prevVal === 0) return { pct: 0, prevMonth: prev, cur };
  const pct = Math.round(((cur - prevVal) / prevVal) * 100);
  return { pct, prevMonth: prev, cur };
}

// Spent per budget category (from expense tx of the given month).
export function getBudgetSpent(state: FinanceState, cat: string, month: string) {
  return txForMonth(state, month)
    .filter((t) => t.type === "out" && t.cat === cat)
    .reduce((s, t) => s + Math.abs(t.value), 0);
}

// Transactions charged to a given card, for a given month.
export function getCardInvoice(state: FinanceState, bank: string, month: string) {
  return txForMonth(state, month).filter((t) => t.type === "out" && t.card === bank);
}

// Categorized spending by type for a beautiful Pie/Donut Chart breakdown.
export function getSpendingByType(state: FinanceState, month: string) {
  const tx = txForMonth(state, month).filter((t) => t.type === "out");

  let fixo = 0;
  let variavel = 0;
  const cartoes: Record<string, number> = {};

  tx.forEach((t) => {
    const val = Math.abs(t.value);
    if (t.card === "Pix") {
      if (t.bucket === "fixo") {
        fixo += val;
      } else {
        variavel += val;
      }
    } else {
      const cardName = `Cartão ${t.card}`;
      cartoes[cardName] = (cartoes[cardName] || 0) + val;
    }
  });

  const result: { name: string; value: number; color: string }[] = [];

  if (fixo > 0) {
    result.push({ name: "Fixos (Pix)", value: fixo, color: "var(--chart-1)" });
  }
  if (variavel > 0) {
    result.push({ name: "Variáveis (Pix)", value: variavel, color: "var(--chart-2)" });
  }

  // Predefined beautiful card colors
  const cardColors = ["var(--chart-5)", "var(--chart-4)", "var(--destructive)", "var(--primary)"];
  Object.keys(cartoes).forEach((cardName, idx) => {
    if (cartoes[cardName] > 0) {
      result.push({
        name: cardName,
        value: cartoes[cardName],
        color: cardColors[idx % cardColors.length],
      });
    }
  });

  return result;
}

