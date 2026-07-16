import { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFinance } from "../../store/finance-context";
import { getMonthSummary, getSpendingByType, txForMonth } from "../../store/selectors";
import { money } from "../shared/currency";
import { SectionCard } from "../shared/ui";
import { toast } from "sonner";
import type { Transaction } from "../../store/types";
import { CATEGORIES, MONTHS } from "../../store/seed";
import { iconFor } from "../shared/icons";

export function DashboardPage({
  onOpenTx,
  onAdd,
  goTo,
  onStartOnboarding,
}: {
  onOpenTx: (t: Transaction) => void;
  onAdd: () => void;
  goTo: (p: any) => void;
  onStartOnboarding?: () => void;
}) {
  const { state, dispatch } = useFinance();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({ desc: "", value: "", cat: "Alimentação" });
  const hidden = state.hideBalances;
  const month = state.currentMonth;
  const { receitas, despesas, saldo } = getMonthSummary(state, month);
  const card = state.cards[0];

  const spendingByType = getSpendingByType(state, month);
  const hasExpenses = spendingByType.length > 0;
  const chartData = hasExpenses
    ? spendingByType
    : [{ name: "Sem gastos", value: 0.1, color: "var(--border)" }];
  const totalTypeExpenses = spendingByType.reduce((sum, item) => sum + item.value, 0);
  const hoveredItem = activeSegment !== null && hasExpenses ? chartData[activeSegment] : null;

  // Helper to resolve card / category icon name mapping for parent categories
  const getParentCategoryIcon = (catName: string) => {
    if (catName === "Fixos (Pix)") return Calendar;
    if (catName === "Variáveis (Pix)") return Zap;
    return CreditCard;
  };

  // Helper to resolve subcategory details
  const getSubcategories = (parentName: string) => {
    const tx = state.transactions.filter((t) => t.month === month && t.type === "out");
    const subCats: Record<string, number> = {};
    tx.forEach((t) => {
      const val = Math.abs(t.value);
      let match = false;
      if (parentName === "Fixos (Pix)") {
        if (t.card === "Pix" && t.bucket === "fixo") match = true;
      } else if (parentName === "Variáveis (Pix)") {
        if (t.card === "Pix" && t.bucket === "variavel") match = true;
      } else if (parentName.startsWith("Cartão ")) {
        const bank = parentName.replace("Cartão ", "");
        if (t.card === bank) match = true;
      }
      if (match) {
        subCats[t.cat] = (subCats[t.cat] || 0) + val;
      }
    });
    return Object.entries(subCats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  // MoM and Average stats for parent categories
  const getCategoryStats = (parentName: string) => {
    const currentIdx = MONTHS.indexOf(month);
    const prevMonthName = currentIdx > 0 ? MONTHS[currentIdx - 1] : null;

    const getSumForMonth = (m: string) => {
      const tx = state.transactions.filter((t) => t.month === m && t.type === "out");
      let total = 0;
      tx.forEach((t) => {
        const val = Math.abs(t.value);
        if (parentName === "Fixos (Pix)") {
          if (t.card === "Pix" && t.bucket === "fixo") total += val;
        } else if (parentName === "Variáveis (Pix)") {
          if (t.card === "Pix" && t.bucket === "variavel") total += val;
        } else if (parentName.startsWith("Cartão ")) {
          const bank = parentName.replace("Cartão ", "");
          if (t.card === bank) total += val;
        }
      });
      return total;
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

  const handleQuickAdd = (parentName: string) => {
    const val = parseFloat(quickAddForm.value);
    if (!quickAddForm.desc.trim() || isNaN(val) || val <= 0) {
      toast.error("Por favor, preencha a descrição e um valor válido.");
      return;
    }

    let cardField = "Pix";
    let bucketField: "fixo" | "variavel" = "variavel";

    if (parentName === "Fixos (Pix)") {
      cardField = "Pix";
      bucketField = "fixo";
    } else if (parentName === "Variáveis (Pix)") {
      cardField = "Pix";
      bucketField = "variavel";
    } else if (parentName.startsWith("Cartão ")) {
      cardField = parentName.replace("Cartão ", "");
      bucketField = "variavel";
    }

    const newTx: Transaction = {
      id: `quick-${Date.now()}`,
      desc: quickAddForm.desc.trim(),
      cat: quickAddForm.cat,
      month: month,
      date: `${new Date().getDate().toString().padStart(2, "0")} ${month}`,
      value: -val,
      type: "out",
      bucket: bucketField,
      card: cardField,
    };

    dispatch({ type: "ADD_TX", tx: newTx });
    toast.success(`Despesa de R$ ${val.toFixed(2)} adicionada com sucesso!`);
    
    // Reset form
    setQuickAddCategory(null);
    setQuickAddForm({ desc: "", value: "", cat: "Alimentação" });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 pb-2"
    >
      {/* Upgraded Spending Distribution Card */}
      <SectionCard title="Distribuição de Gastos" action={<p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{month}</p>}>
        {/* 2. Donut Chart + Accordion List */}
        <div className="flex flex-col md:flex-row items-center gap-6 py-2">
          {/* Donut Chart Visualizer */}
          <div className="relative w-[150px] h-[150px] flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ borderStyle: "none" }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={hasExpenses ? 3 : 0}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                  animationBegin={0}
                  animationDuration={600}
                  stroke="none"
                >
                  {chartData.map((entry, index) => {
                    const isHovered = activeSegment === index;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                        style={{
                          filter: isHovered && hasExpenses ? "brightness(1.1) drop-shadow(0px 0px 4px rgba(255,255,255,0.1))" : "none",
                          transition: "all 0.2s ease-out",
                          transform: isHovered && hasExpenses ? "scale(1.04)" : "scale(1)",
                          transformOrigin: "50% 50%",
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Labels */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider truncate max-w-[80px]">
                {hoveredItem ? hoveredItem.name.split(" ")[0] : "Total"}
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground leading-tight">
                {money(hoveredItem ? hoveredItem.value : totalTypeExpenses, hidden)}
              </span>
              {totalTypeExpenses > 0 && (
                <span className="text-[9px] text-muted-foreground font-semibold">
                  {hoveredItem
                    ? `${Math.round((hoveredItem.value / totalTypeExpenses) * 100)}%`
                    : "100%"}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Legend List (Accordion) */}
          <div className="flex-1 w-full flex flex-col gap-2">
            {chartData.map((entry, index) => {
              const isHovered = activeSegment === index;
              const pct = totalTypeExpenses > 0 ? (entry.value / totalTypeExpenses) * 100 : 0;
              const isExpanded = expandedCategory === entry.name;
              
              // Load dynamic historical stats
              const { momPct, avgVal } = getCategoryStats(entry.name);
              const ParentIcon = getParentCategoryIcon(entry.name);

              return (
                <div
                  key={entry.name}
                  className={`rounded-2xl border transition-all duration-350 overflow-hidden ${
                    isExpanded 
                      ? "bg-muted/40 border-border/70 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-muted/20"
                  }`}
                  onMouseEnter={() => hasExpenses && setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {/* Category Header Row */}
                  <div 
                    onClick={() => hasExpenses && setExpandedCategory(isExpanded ? null : entry.name)}
                    className="flex items-center justify-between p-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200"
                        style={{ 
                          backgroundColor: `${entry.color}15`, 
                          color: entry.color,
                          transform: isHovered && hasExpenses ? "scale(1.1)" : "scale(1)"
                        }}
                      >
                        <ParentIcon size={14} strokeWidth={2.5} />
                      </div>
                      
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-tight transition-colors ${isHovered && hasExpenses ? "text-foreground" : "text-muted-foreground"}`}>
                          {entry.name}
                        </p>
                        {hasExpenses && (
                          <p className="text-[9px] text-muted-foreground font-medium">
                            Média: <span className="font-mono">{money(avgVal, hidden)}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Trend indicator and MoM percentage */}
                      {hasExpenses && entry.name !== "Sem gastos" && (
                        <div className="flex items-center gap-1">
                          {momPct > 0 ? (
                            <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/10">
                              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5" />
                              {momPct}%
                            </span>
                          ) : momPct < 0 ? (
                            <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/10">
                              <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5" />
                              {Math.abs(momPct)}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full font-mono">
                              0%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Values */}
                      <div className="text-right flex flex-col leading-tight">
                        <span className="text-[11px] font-bold font-mono text-foreground">
                          {entry.name === "Sem gastos" ? money(0, hidden) : money(entry.value, hidden)}
                        </span>
                        {hasExpenses && (
                          <span className="text-[9px] font-bold text-muted-foreground font-mono">
                            {pct.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* Action buttons (Quick Add and Chevron) */}
                      {entry.name !== "Sem gastos" && (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickAddCategory(quickAddCategory === entry.name ? null : entry.name);
                              setExpandedCategory(entry.name); // Auto-expand if adding a transaction
                            }}
                            className="p-1 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
                            title="Adicionar Gasto nesta categoria"
                          >
                            <Plus size={11} strokeWidth={3} />
                          </button>
                          
                          <div className="text-muted-foreground/60">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accordion Expansion Body */}
                  <AnimatePresence>
                    {isExpanded && entry.name !== "Sem gastos" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="px-4 pb-3 pt-1 border-t border-border/40"
                      >
                        {/* Inline Quick Add Expense form */}
                        {quickAddCategory === entry.name && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-3.5 p-3 rounded-xl border border-primary/20 bg-primary/[0.02] flex flex-col gap-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                <Plus size={11} strokeWidth={3} /> Nova despesa em {entry.name}
                              </span>
                              <button 
                                onClick={() => setQuickAddCategory(null)}
                                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Descrição</label>
                                <input 
                                  type="text"
                                  placeholder="Ex: Farmácia, Uber"
                                  value={quickAddForm.desc}
                                  onChange={(e) => setQuickAddForm({ ...quickAddForm, desc: e.target.value })}
                                  className="w-full px-2 py-1 text-xs rounded-lg border border-border bg-input-background text-foreground outline-none focus:border-primary/50"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Valor (R$)</label>
                                <input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={quickAddForm.value}
                                  onChange={(e) => setQuickAddForm({ ...quickAddForm, value: e.target.value })}
                                  className="w-full px-2 py-1 text-xs rounded-lg border border-border bg-input-background text-foreground font-mono outline-none focus:border-primary/50"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Subcategoria</label>
                                <select 
                                  value={quickAddForm.cat}
                                  onChange={(e) => setQuickAddForm({ ...quickAddForm, cat: e.target.value })}
                                  className="w-full px-2 py-1 text-xs rounded-lg border border-border bg-input-background text-foreground outline-none focus:border-primary/50 cursor-pointer"
                                >
                                  {CATEGORIES.filter((c) => !c.name.includes("Renda")).map((c) => (
                                    <option key={c.name} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <button
                                onClick={() => handleQuickAdd(entry.name)}
                                className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:brightness-105 transition-all cursor-pointer self-end shadow-sm"
                              >
                                Salvar
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* Subcategories Breakdown list */}
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/80 mb-0.5">
                            Subcategorias de Gastos
                          </p>
                          {getSubcategories(entry.name).length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic py-1">Nenhum gasto detalhado este mês.</p>
                          ) : (
                            getSubcategories(entry.name).map((sub) => {
                              const subcatPct = entry.value > 0 ? (sub.value / entry.value) * 100 : 0;
                              
                              // Find subcategory icon dynamically
                              const catMeta = CATEGORIES.find(c => c.name === sub.name);
                              const SubIcon = iconFor(catMeta?.iconName);

                              return (
                                <div key={sub.name} className="flex flex-col gap-1 py-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 font-semibold text-foreground/90">
                                      <SubIcon size={12} className="text-muted-foreground" />
                                      {sub.name}
                                    </span>
                                    <span className="font-mono font-bold text-foreground">
                                      {money(sub.value, hidden)}
                                      <span className="text-[9px] text-muted-foreground/70 font-semibold font-sans ml-1.5">
                                        ({subcatPct.toFixed(0)}%)
                                      </span>
                                    </span>
                                  </div>
                                  
                                  {/* Micro progress bar */}
                                  <div className="w-full h-1 rounded-full bg-border/50 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full" 
                                      style={{ 
                                        width: `${subcatPct}%`,
                                        backgroundColor: entry.color
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>


      </SectionCard>

      {/* Gastos Fixos Card */}
      <SectionCard title="Gastos Fixos" action={<p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{month}</p>}>
        <div className="flex flex-col gap-3">
          {txFixos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum gasto fixo este mês.</p>
          ) : (
            txFixos.map(t => {
              const catMeta = CATEGORIES.find(c => c.name === t.cat);
              const SubIcon = iconFor(catMeta?.iconName);
              return (
                <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors px-2 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `${catMeta?.color || "#888"}15`, 
                        color: catMeta?.color || "#888"
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
              const SubIcon = iconFor(catMeta?.iconName);
              return (
                <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors px-2 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `${catMeta?.color || "#888"}15`, 
                        color: catMeta?.color || "#888"
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
    </motion.div>
  );
}

