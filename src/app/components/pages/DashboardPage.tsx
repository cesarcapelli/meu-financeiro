import React, { useState, useMemo } from "react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  ChevronRight, 
  Plus, 
  ArrowRightLeft, 
  Target, 
  CreditCard, 
  Wallet, 
  ExternalLink, 
  Check, 
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Activity,
  AlertTriangle,
  Flame,
  X,
  Sparkles,
  Search,
  Trash2,
  Repeat,
  Tag,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFinance } from "../../store/finance-context";
import { getMonthSummary, getSpendingByType, txForMonth } from "../../store/selectors";
import { money } from "../shared/currency";
import { SectionCard } from "../shared/ui";
import { BottomSheet } from "../shared/BottomSheet";
import { toast } from "sonner";
import type { Transaction } from "../../store/types";
import { CATEGORIES, MONTHS } from "../../store/seed";
import { iconFor } from "../shared/icons";

function DueDatesAndSurplusSection({
  state,
  month,
  hidden,
}: {
  state: any;
  month: string;
  hidden: boolean;
  onOpenTx?: (t: Transaction) => void;
}) {
  const currentTxs = useMemo(
    () => state.transactions.filter((t: Transaction) => t.month === month),
    [state.transactions, month]
  );

  const expenses = useMemo(
    () => currentTxs.filter((t: Transaction) => t.type === "out" || t.value < 0),
    [currentTxs]
  );

  const incomes = useMemo(
    () => currentTxs.filter((t: Transaction) => t.type === "in" || t.value > 0),
    [currentTxs]
  );

  const getDayNum = (dateStr: string): number => {
    if (!dateStr) return 1;
    const match = dateStr.match(/\d+/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (n >= 1 && n <= 31) return n;
    }
    return 1;
  };

  // Identify income types: Pagamento / Salário vs Vale / Adiantamento / Benefícios Pix
  const pagamentoTxs = incomes.filter(
    (t: Transaction) =>
      /pagamento|salário|salario|remuneração/i.test(t.desc) ||
      t.cat === "Salário"
  );

  const valeTxs = incomes.filter(
    (t: Transaction) => !pagamentoTxs.includes(t)
  );

  const totalPagamento = pagamentoTxs.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);
  const pagamentoDay = pagamentoTxs.length > 0 ? Math.min(...pagamentoTxs.map((t: Transaction) => getDayNum(t.date))) : 5;

  const totalVale = valeTxs.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);
  const valeDay = valeTxs.length > 0 ? Math.min(...valeTxs.map((t: Transaction) => getDayNum(t.date))) : 20;

  const totalIncomes = incomes.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);
  const hasVale = totalVale > 0 || valeTxs.length > 0;
  const cutoffDay = hasVale ? valeDay : 32;

  // Expenses grouped by cutoff (Dia 15 and Dia 30)
  const expensesDia15 = expenses.filter((t: Transaction) => getDayNum(t.date) <= 15);
  const expensesDia30 = expenses.filter((t: Transaction) => getDayNum(t.date) > 15);

  const totalGastosDia15 = expensesDia15.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);
  const totalGastosDia30 = expensesDia30.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);

  // Incomes assigned to Dia 15 (Pagamento/Salário) vs Dia 30 (Vale/Adiantamento/Pix)
  const incomesDia15 = incomes.filter(
    (t: Transaction) =>
      /pagamento|salário|salario|remuneração/i.test(t.desc) ||
      t.cat === "Salário" ||
      getDayNum(t.date) <= 15
  );

  const incomesDia30 = incomes.filter((t: Transaction) => !incomesDia15.includes(t));

  let totalReceitasDia15 = incomesDia15.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);
  let totalReceitasDia30 = incomesDia30.reduce((s: number, t: Transaction) => s + Math.abs(t.value), 0);

  if (totalReceitasDia15 === 0 && totalReceitasDia30 === 0) {
    totalReceitasDia15 = totalIncomes;
  }

  const saldoDia15 = totalReceitasDia15 - totalGastosDia15;
  const saldoDia30 = totalReceitasDia30 - totalGastosDia30;

  const [expandedPeriod, setExpandedPeriod] = useState<"dia15" | "dia30" | null>(null);

  return (
    <SectionCard
      title="Saldos Disponíveis"
      action={
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">
          {month}
        </p>
      }
      className="overflow-hidden w-full"
    >
      <div className="flex flex-col gap-2.5 w-full">
        {/* Card 1: Vencimento & Gastos Dia 15 */}
        <div className="flex flex-col w-full">
          <div
            onClick={() => setExpandedPeriod(expandedPeriod === "dia15" ? null : "dia15")}
            className={`rounded-2xl border p-3 flex items-center justify-between gap-3 w-full cursor-pointer transition-all ${
              expandedPeriod === "dia15"
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                : "bg-background/50 border-border/50 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 font-bold">
                <Wallet size={16} strokeWidth={2.5} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold leading-tight text-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>Gastos & Receitas (Dia 15)</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                    1º Período
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex flex-wrap items-center gap-x-1">
                  <span>Receita: <span className="font-mono text-emerald-500 font-semibold">{money(totalReceitasDia15, hidden)}</span></span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>Gastos: <span className="font-mono text-red-500 font-semibold">{money(totalGastosDia15, hidden)}</span></span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                Saldo Dia 15
              </p>
              <p className={`text-sm sm:text-base font-black font-mono whitespace-nowrap ${saldoDia15 >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500"}`}>
                {money(saldoDia15, hidden)}
              </p>
            </div>
          </div>

          {/* Expanded detail for Dia 15 */}
          <AnimatePresence>
            {expandedPeriod === "dia15" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-3 sm:pl-4 pr-1 py-2 space-y-1.5 border-l-2 border-emerald-500/30 ml-4 my-1"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Contas com vencimento até dia 15 ({expensesDia15.length})
                </p>
                {expensesDia15.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">Nenhum gasto registrado até o dia 15.</p>
                ) : (
                  expensesDia15.map((t: Transaction) => {
                    const catMeta = CATEGORIES.find((c) => c.name === t.cat);
                    const IconComp = iconFor(catMeta?.iconName);
                    return (
                      <div
                        key={t.id}
                        onClick={() => onOpenTx?.(t)}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            <IconComp size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground break-words leading-tight">{t.desc}</p>
                            <span className="text-[9px] text-muted-foreground font-semibold">{t.date} • {t.cat}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-500 shrink-0">
                          -{money(Math.abs(t.value), hidden)}
                        </span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 2: Vencimento & Gastos Dia 30 */}
        <div className="flex flex-col w-full">
          <div
            onClick={() => setExpandedPeriod(expandedPeriod === "dia30" ? null : "dia30")}
            className={`rounded-2xl border p-3 flex items-center justify-between gap-3 w-full cursor-pointer transition-all ${
              expandedPeriod === "dia30"
                ? "bg-violet-500/10 border-violet-500/40 shadow-sm"
                : "bg-background/50 border-border/50 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0 font-bold">
                <Coins size={16} strokeWidth={2.5} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold leading-tight text-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>Gastos & Receitas (Dia 30)</span>
                  <span className="text-[9px] bg-violet-500/15 text-violet-400 font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                    2º Período
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex flex-wrap items-center gap-x-1">
                  <span>Receita: <span className="font-mono text-violet-400 font-semibold">{money(totalReceitasDia30, hidden)}</span></span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>Gastos: <span className="font-mono text-red-500 font-semibold">{money(totalGastosDia30, hidden)}</span></span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                Saldo Dia 30
              </p>
              <p className={`text-sm sm:text-base font-black font-mono whitespace-nowrap ${saldoDia30 >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500"}`}>
                {money(saldoDia30, hidden)}
              </p>
            </div>
          </div>

          {/* Expanded detail for Dia 30 */}
          <AnimatePresence>
            {expandedPeriod === "dia30" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-3 sm:pl-4 pr-1 py-2 space-y-1.5 border-l-2 border-violet-500/30 ml-4 my-1"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Contas com vencimento do dia 16 ao 30 ({expensesDia30.length})
                </p>
                {expensesDia30.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">Nenhum gasto registrado após o dia 15.</p>
                ) : (
                  expensesDia30.map((t: Transaction) => {
                    const catMeta = CATEGORIES.find((c) => c.name === t.cat);
                    const IconComp = iconFor(catMeta?.iconName);
                    return (
                      <div
                        key={t.id}
                        onClick={() => onOpenTx?.(t)}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            <IconComp size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground break-words leading-tight">{t.desc}</p>
                            <span className="text-[9px] text-muted-foreground font-semibold">{t.date} • {t.cat}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-500 shrink-0">
                          -{money(Math.abs(t.value), hidden)}
                        </span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionCard>
  );
}

export function DashboardPage({
  onOpenTx,
  onAdd,
  goTo,
  onStartOnboarding,
  onOpenAiInput,
}: {
  onOpenTx: (t: Transaction) => void;
  onAdd: () => void;
  goTo: (p: any) => void;
  onStartOnboarding?: () => void;
  onOpenAiInput?: () => void;
}) {
  const { state, dispatch } = useFinance();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({ desc: "", value: "", cat: "Alimentação" });
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalQuickAddOpen, setModalQuickAddOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ desc: "", value: "", cat: "" });

  const hidden = state.hideBalances;
  const month = state.currentMonth;
  const { receitas, despesas, saldo } = getMonthSummary(state, month);
  const card = state.cards[0];

  const spendingByType = getSpendingByType(state, month);
  const totalTypeExpenses = spendingByType.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = receitas;
  const remainingIncome = totalIncome > 0 ? Math.max(0, totalIncome - totalTypeExpenses) : 0;
  const hasExpenses = spendingByType.length > 0;

  // Chart data representing actual expense categories
  const chartData = hasExpenses
    ? spendingByType
    : [{ name: "Sem gastos", value: 0.1, color: "var(--border)" }];

  // Pie chart data including subtle background track for remaining income
  const pieChartData = useMemo(() => {
    if (!hasExpenses) return chartData;
    if (totalIncome > totalTypeExpenses) {
      return [
        ...spendingByType,
        {
          name: "Saldo Livre",
          value: totalIncome - totalTypeExpenses,
          color: "rgba(255, 255, 255, 0.08)",
          isBackground: true,
        },
      ];
    }
    return spendingByType;
  }, [hasExpenses, spendingByType, totalIncome, totalTypeExpenses, chartData]);

  const hoveredItem = activeSegment !== null && pieChartData[activeSegment] ? pieChartData[activeSegment] : null;

  // Helper to resolve category color
  const getCategoryColor = (catName: string): string => {
    const categoryColors: Record<string, string> = {
      "Alimentação": "#F59E0B",
      "Transporte": "#3B82F6",
      "Moradia": "#10B981",
      "Lazer": "#EC4899",
      "Saúde": "#EF4444",
      "Educação": "#8B5CF6",
      "Assinaturas": "#06B6D4",
      "Contas": "#0284C7",
      "Renda": "#10B981",
      "Salário": "#10B981",
      "Renda Extra": "#10B981",
      "Outros": "#6B7280",
    };
    return categoryColors[catName] || "#8B5CF6";
  };

  // Helper to resolve icon for a category
  const getParentCategoryIcon = (catName: string) => {
    const iconNameMap: Record<string, string> = {
      "Alimentação": "Utensils",
      "Transporte": "Car",
      "Moradia": "Home",
      "Lazer": "Sparkles",
      "Saúde": "HeartPulse",
      "Educação": "GraduationCap",
      "Assinaturas": "Wifi",
      "Contas": "Zap",
      "Renda": "TrendingUp",
      "Salário": "TrendingUp",
      "Renda Extra": "TrendingUp",
      "Outros": "Tag",
      "Geral": "Wallet",
    };
    const name = iconNameMap[catName] || CATEGORIES.find((c) => c.name === catName)?.iconName;
    return iconFor(name);
  };

  // Helper to resolve transactions for a specific category in the current month
  const getCategoryTransactions = (catName: string) => {
    return state.transactions.filter(
      (t) => t.month === month && (t.type === "out" || (t.type !== "in" && t.value < 0)) && (t.cat === catName || (!t.cat && catName === "Outros"))
    );
  };

  // Dynamic projection factor
  const currentDay = Math.min(30, Math.max(1, new Date().getDate()));
  const projectedSpend = totalTypeExpenses * (30 / currentDay);
  const totalBudget = state.budgets.reduce((sum, b) => sum + b.limite, 0);
  const remainingBudget = totalBudget - totalTypeExpenses;
  const budgetPct = totalBudget > 0 ? (totalTypeExpenses / totalBudget) * 100 : 0;

  // Computation for Fixos and Variáveis cards
  const txFixos = state.transactions.filter(t => t.month === month && t.type === "out" && t.bucket === "fixo").sort((a, b) => parseInt(b.date) - parseInt(a.date));
  const totalFixos = txFixos.reduce((acc, t) => acc + Math.abs(t.value), 0);

  const txVariaveis = state.transactions.filter(t => t.month === month && t.type === "out" && t.bucket === "variavel").sort((a, b) => parseInt(b.date) - parseInt(a.date));
  const totalVariaveis = txVariaveis.reduce((acc, t) => acc + Math.abs(t.value), 0);

  // MoM and Average stats for category
  const getCategoryStats = (catName: string) => {
    const currentIdx = MONTHS.indexOf(month);
    const prevMonthName = currentIdx > 0 ? MONTHS[currentIdx - 1] : null;

    const getSumForMonth = (m: string) => {
      return state.transactions
        .filter((t) => t.month === m && t.type === "out" && (t.cat === catName || (!t.cat && catName === "Outros")))
        .reduce((s, t) => s + Math.abs(t.value), 0);
    };

    const currentVal = getSumForMonth(month);
    const prevVal = prevMonthName ? getSumForMonth(prevMonthName) : 0;

    // Calculate historical average
    const activeMonths = MONTHS.filter(m => state.transactions.some(t => t.month === m));
    const totals = activeMonths.map(m => getSumForMonth(m));
    const avgVal = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : currentVal;

    let momPct = 0;
    if (prevVal > 0) {
      momPct = Math.round(((currentVal - prevVal) / prevVal) * 100);
    }

    return { momPct, avgVal, prevVal };
  };

  const handleQuickAdd = (catName: string) => {
    const val = parseFloat(quickAddForm.value);
    if (!quickAddForm.desc.trim() || isNaN(val) || val <= 0) {
      toast.error("Por favor, preencha a descrição e um valor válido.");
      return;
    }

    const todayDayMonth = `${new Date().getDate().toString().padStart(2, "0")}/${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;

    const newTx: Transaction = {
      id: `quick-${Date.now()}`,
      desc: quickAddForm.desc.trim(),
      cat: catName,
      month: month,
      date: todayDayMonth,
      value: -val,
      type: "out",
      bucket: catName === "Moradia" || catName === "Contas" || catName === "Assinaturas" ? "fixo" : "variavel",
      card: "Pix",
    };

    dispatch({ type: "ADD_TX", tx: newTx });
    toast.success(`Despesa de R$ ${val.toFixed(2)} em ${catName} adicionada com sucesso!`);

    setQuickAddCategory(null);
    setQuickAddForm({ desc: "", value: "", cat: catName });
  };

  const handleModalQuickAdd = (catName: string) => {
    const val = parseFloat(modalForm.value);
    if (!modalForm.desc.trim() || isNaN(val) || val <= 0) {
      toast.error("Por favor, preencha a descrição e um valor válido.");
      return;
    }

    const todayDayMonth = `${new Date().getDate().toString().padStart(2, "0")}/${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
    const subCat = modalForm.cat || catName;

    const newTx: Transaction = {
      id: `quick-${Date.now()}`,
      desc: modalForm.desc.trim(),
      cat: subCat,
      month: month,
      date: todayDayMonth,
      value: -val,
      type: "out",
      bucket: subCat === "Moradia" || subCat === "Contas" || subCat === "Assinaturas" ? "fixo" : "variavel",
      card: "Pix",
    };

    dispatch({ type: "ADD_TX", tx: newTx });
    toast.success(`Despesa de R$ ${val.toFixed(2)} em ${subCat} adicionada com sucesso!`);

    setModalQuickAddOpen(false);
    setModalForm({ desc: "", value: "", cat: subCat });
  };

  const handleDeleteTx = (txId: string, desc: string) => {
    dispatch({ type: "DELETE_TX", id: txId });
    toast.success(`Lançamento "${desc}" removido com sucesso.`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 pb-2"
    >
      {/* Upgraded Spending Distribution Card */}
      <SectionCard 
        title="Distribuição de Gastos" 
        action={
          <div className="flex items-center gap-2">
            {totalIncome > 0 && (
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-500/10 text-teal-500 border border-teal-500/20">
                100% = Receita ({money(totalIncome, hidden)})
              </span>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{month}</p>
          </div>
        } 
        className="overflow-hidden w-full"
      >
        {/* Donut Chart + Accordion List Container */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 py-2 w-full overflow-hidden">
          {/* Donut Chart Visualizer */}
          <div className="relative w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] flex items-center justify-center shrink-0">
            <PieChart width={140} height={140} style={{ borderStyle: "none", outline: "none" }}>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={hasExpenses ? 2 : 0}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveSegment(index)}
                onMouseLeave={() => setActiveSegment(null)}
                animationBegin={0}
                animationDuration={600}
                stroke="none"
              >
                {pieChartData.map((entry, index) => {
                  const isHovered = activeSegment === index;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={isHovered ? "var(--background)" : "none"}
                      strokeWidth={isHovered ? 2 : 0}
                      style={{
                        opacity: activeSegment !== null && !isHovered ? 0.65 : 1,
                        filter: isHovered ? "brightness(1.15)" : "none",
                        transition: "all 0.2s ease-out",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>

            {/* Center Summary Labels */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-1.5 px-3">
              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider line-clamp-1">
                {hoveredItem ? hoveredItem.name : "Total Gastos"}
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-foreground leading-tight whitespace-nowrap">
                {money(
                  hoveredItem
                    ? hoveredItem.value
                    : totalTypeExpenses,
                  hidden
                )}
              </span>
              {totalIncome > 0 ? (
                <span className="text-[9px] font-bold text-teal-500 line-clamp-1">
                  {hoveredItem
                    ? `${((hoveredItem.value / totalIncome) * 100).toFixed(1)}% da receita`
                    : `${Math.round((totalTypeExpenses / totalIncome) * 100)}% da receita`}
                </span>
              ) : (
                totalTypeExpenses > 0 && (
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    {hoveredItem
                      ? `${Math.round((hoveredItem.value / totalTypeExpenses) * 100)}%`
                      : "100% dos gastos"}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-2 overflow-hidden">
            {chartData.map((entry, index) => {
              const isHovered = activeSegment === index;
              const pctOfIncome = totalIncome > 0 ? (entry.value / totalIncome) * 100 : (totalTypeExpenses > 0 ? (entry.value / totalTypeExpenses) * 100 : 0);
              const { momPct, avgVal } = getCategoryStats(entry.name);
              const ParentIcon = getParentCategoryIcon(entry.name);

              return (
                <div
                  key={entry.name}
                  onClick={() => {
                    if (entry.name !== "Sem gastos" && hasExpenses) {
                      setSelectedCategoryModal(entry.name);
                    }
                  }}
                  className={`rounded-2xl border p-2.5 sm:p-3 transition-all duration-200 select-none flex items-center justify-between gap-2.5 w-full ${
                    entry.name !== "Sem gastos" ? "cursor-pointer hover:bg-muted/20 hover:border-border" : "cursor-default"
                  } ${
                    isHovered
                      ? "bg-muted/30 border-primary/30 shadow-sm"
                      : "bg-transparent border-transparent"
                  }`}
                  onMouseEnter={() => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200"
                      style={{
                        backgroundColor: `${entry.color}18`,
                        color: entry.color,
                        transform: isHovered ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      <ParentIcon size={15} strokeWidth={2.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-tight truncate transition-colors ${isHovered ? "text-foreground" : "text-foreground/90"}`}>
                        {entry.name}
                      </p>
                      {hasExpenses && entry.name !== "Sem gastos" && (
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          Média: <span className="font-mono">{money(avgVal, hidden)}</span>
                          {momPct !== 0 && (
                            <span className={`sm:hidden ml-1 font-bold ${momPct > 0 ? "text-red-500" : "text-green-500"}`}>
                              ({momPct > 0 ? "+" : ""}{momPct}%)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* MoM Badge */}
                    {hasExpenses && entry.name !== "Sem gastos" && momPct !== 0 && (
                      <div className="hidden sm:flex items-center">
                        {momPct > 0 ? (
                          <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/10 whitespace-nowrap">
                            <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5" />
                            {momPct}%
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/10 whitespace-nowrap">
                            <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5" />
                            {Math.abs(momPct)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Values */}
                    <div className="text-right flex flex-col leading-tight shrink-0">
                      <span className="text-[11px] sm:text-xs font-bold font-mono text-foreground whitespace-nowrap">
                        {entry.name === "Sem gastos" ? money(0, hidden) : money(entry.value, hidden)}
                      </span>
                      <span className="text-[9px] font-bold font-mono text-right text-muted-foreground">
                        {pctOfIncome.toFixed(1)}% {totalIncome > 0 ? "da receita" : "do total"}
                      </span>
                    </div>

                    {/* Arrow Indicator */}
                    {entry.name !== "Sem gastos" && (
                      <div className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                        <ChevronRight size={13} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Contas por Dia de Vencimento e Sobra do Vale/Pagamento */}
      <DueDatesAndSurplusSection
        state={state}
        month={month}
        hidden={hidden}
        onOpenTx={onOpenTx}
      />

      {/* Gastos Fixos Card */}
      <SectionCard title="Gastos Fixos" action={<p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{month}</p>}>
        <div className="flex flex-col gap-3">
          {txFixos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum gasto fixo este mês.</p>
          ) : (
            txFixos.map(t => {
              const catMeta = CATEGORIES.find(c => c.name === t.cat);
              const color = getCategoryColor(t.cat);
              const SubIcon = iconFor(catMeta?.iconName);
              return (
                <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors px-2 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `${color}15`, 
                        color: color
                      }}
                    >
                      <SubIcon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{t.desc}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{t.cat} • {t.date}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${t.value !== 0 ? "text-red-500" : "text-muted-foreground"}`}>{money(Math.abs(t.value), hidden)}</span>
                </div>
              );
            })
          )}
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border px-2">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Total Fixos</span>
            <span className={`text-sm font-mono font-black ${totalFixos > 0 ? "text-red-500" : "text-muted-foreground"}`}>{money(totalFixos, hidden)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Gastos Variáveis Card */}
      <SectionCard title="Gastos Variáveis" action={<p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{month}</p>}>
        <div className="flex flex-col gap-3">
          {txVariaveis.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum gasto variável este mês.</p>
          ) : (
            txVariaveis.map(t => {
              const catMeta = CATEGORIES.find(c => c.name === t.cat);
              const color = getCategoryColor(t.cat);
              const SubIcon = iconFor(catMeta?.iconName);
              return (
                <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors px-2 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `${color}15`, 
                        color: color
                      }}
                    >
                      <SubIcon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{t.desc}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{t.cat} • {t.date}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${t.value !== 0 ? "text-red-500" : "text-muted-foreground"}`}>{money(Math.abs(t.value), hidden)}</span>
                </div>
              );
            })
          )}
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border px-2">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Total Variáveis</span>
            <span className={`text-sm font-mono font-black ${totalVariaveis > 0 ? "text-red-500" : "text-muted-foreground"}`}>{money(totalVariaveis, hidden)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Large Category Detail Bottom Sheet / Modal */}
      {selectedCategoryModal && (() => {
        const selectedCatName = selectedCategoryModal;
        const selectedCatTransactions = getCategoryTransactions(selectedCatName);
        const selectedCatTotal = selectedCatTransactions.reduce((acc, t) => acc + Math.abs(t.value), 0);
        const selectedCatPct = totalIncome > 0 ? (selectedCatTotal / totalIncome) * 100 : (totalTypeExpenses > 0 ? (selectedCatTotal / totalTypeExpenses) * 100 : 0);
        const { momPct: selMomPct, avgVal: selAvgVal } = getCategoryStats(selectedCatName);
        const SelCategoryIcon = getParentCategoryIcon(selectedCatName);
        const selCategoryColor = getCategoryColor(selectedCatName);

        const filteredModalTxs = selectedCatTransactions.filter((t) =>
          t.desc.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
          (t.card && t.card.toLowerCase().includes(modalSearchQuery.toLowerCase()))
        );

        return (
          <BottomSheet
            open={!!selectedCategoryModal}
            fullHeight={true}
            onClose={() => {
              setSelectedCategoryModal(null);
              setModalSearchQuery("");
              setModalQuickAddOpen(false);
            }}
          >
            <div className="flex flex-col gap-4 pt-1 pb-4 w-full min-w-0">
              {/* Category Header Card */}
              <div
                className="rounded-2xl p-4 sm:p-5 border flex flex-col gap-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${selCategoryColor}15 0%, var(--card) 100%)`,
                  borderColor: `${selCategoryColor}35`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${selCategoryColor}25`, color: selCategoryColor }}
                    >
                      <SelCategoryIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black text-foreground leading-tight truncate">
                        {selectedCategoryModal}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        Lançamentos de {month}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCategoryModal(null)}
                    className="p-1.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground transition-colors cursor-pointer shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Big Amount */}
                <div className="flex items-baseline justify-between border-t border-border/40 pt-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Total da Categoria</p>
                    <p className="text-2xl sm:text-3xl font-black font-mono text-foreground leading-tight truncate">
                      {money(selectedCatTotal, hidden)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold font-mono text-primary bg-primary/10">
                      {selectedCatPct.toFixed(1)}% {totalIncome > 0 ? "da receita" : "do total"}
                    </span>
                  </div>
                </div>

                {/* 3 Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex flex-col min-w-0">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground truncate">Média Mensal</span>
                    <span className="text-xs font-bold font-mono text-foreground truncate">{money(selAvgVal, hidden)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex flex-col min-w-0">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground truncate">MoM</span>
                    <span className={`text-xs font-bold truncate ${selMomPct > 0 ? "text-red-500" : selMomPct < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {selMomPct > 0 ? `+${selMomPct}%` : `${selMomPct}%`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex flex-col min-w-0">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground truncate">Registros</span>
                    <span className="text-xs font-bold font-mono text-foreground truncate">{selectedCatTransactions.length} itens</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Toggle and Form */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setModalQuickAddOpen(!modalQuickAddOpen);
                    setModalForm({ desc: "", value: "", cat: selectedCategoryModal });
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-xs font-bold text-primary w-full"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Plus size={15} strokeWidth={2.5} className="shrink-0" />
                    Adicionar novo gasto em {selectedCategoryModal}
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 shrink-0 ${modalQuickAddOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {modalQuickAddOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-2xl border border-primary/30 bg-card flex flex-col gap-3 shadow-sm w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="min-w-0">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Descrição</label>
                            <input
                              type="text"
                              placeholder="Ex: Supermercado, Almoço"
                              value={modalForm.desc}
                              onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={modalForm.value}
                              onChange={(e) => setModalForm({ ...modalForm, value: e.target.value })}
                              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Subcategoria</label>
                            <select
                              value={modalForm.cat || selectedCategoryModal}
                              onChange={(e) => setModalForm({ ...modalForm, cat: e.target.value })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary cursor-pointer"
                            >
                              {CATEGORIES.filter((c) => !c.name.includes("Renda")).map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => handleModalQuickAdd(selectedCategoryModal)}
                            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:brightness-105 transition-all cursor-pointer shadow-sm self-end shrink-0"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Bar */}
              {selectedCatTransactions.length > 3 && (
                <div className="relative w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar lançamento nesta categoria..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Transactions List */}
              <div className="flex flex-col gap-2.5 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Lançamentos ({filteredModalTxs.length})
                  </h4>
                </div>

                {filteredModalTxs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Tag size={24} className="opacity-40" />
                    <p className="text-xs font-medium">Nenhum lançamento encontrado nesta categoria.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-hide">
                    {filteredModalTxs.map((tx) => {
                      const txVal = Math.abs(tx.value);
                      const txPct = selectedCatTotal > 0 ? (txVal / selectedCatTotal) * 100 : 0;

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted/20 transition-all flex flex-col gap-2.5 shadow-sm w-full min-w-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <span className="font-bold text-foreground text-sm leading-snug break-words">
                                {tx.desc}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground font-medium pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {tx.date}
                                </span>
                                {tx.card && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary">
                                    {tx.card}
                                  </span>
                                )}
                                {(tx.bucket === "fixo" || tx.isRecurring) && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-500 flex items-center gap-1">
                                    <Repeat size={10} /> Fixo
                                  </span>
                                )}
                                {tx.isSplit && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400">
                                    Dividido {tx.splitWith ? `(${tx.splitWith})` : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-mono font-black text-foreground text-sm sm:text-base text-right">
                                {money(txVal, hidden)}
                              </span>

                              <button
                                onClick={() => handleDeleteTx(tx.id, tx.desc)}
                                className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Excluir lançamento"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Micro progress bar relative to category total */}
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, txPct)}%`,
                                  backgroundColor: selCategoryColor,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                              {txPct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </BottomSheet>
        );
      })()}
    </motion.div>
  );
}

