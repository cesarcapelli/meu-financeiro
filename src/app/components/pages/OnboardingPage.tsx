import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  CheckCircle2,
  X,
  Edit2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Utensils,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "../../store/finance-context";
import { money } from "../shared/currency";
import type { Transaction } from "../../store/types";
import { BottomSheet } from "../shared/BottomSheet";

interface ExpenseItem {
  id: string;
  name: string;
  value: number;
  dueDay: number;
  splitEnabled: boolean;
  splitType: "50-50" | "custom";
  splitPercentage: number;
  splitWith: string;
}

interface ExtraBenefit {
  id: string;
  name: string;
  value: number;
  dueDay: number;
}

interface OnboardingPageProps {
  onComplete: () => void;
  onBackToDashboard: () => void;
}

interface DayPickerSelectProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  focusBorderColor?: string;
}

function DayPickerSelect({
  value,
  onChange,
  className = "w-[76px]",
  focusBorderColor = "focus:border-primary/50",
}: DayPickerSelectProps) {
  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full bg-muted/40 hover:bg-muted/60 border border-border/60 ${focusBorderColor} rounded-lg pl-7 pr-4 py-1.5 text-xs text-center font-bold text-foreground outline-none cursor-pointer appearance-none transition-all shadow-xs`}
        title="Selecione o dia"
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d} className="bg-card text-foreground font-semibold">
            {String(d).padStart(2, "0")}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export function OnboardingPage({ onComplete, onBackToDashboard }: OnboardingPageProps) {
  const { state, dispatch } = useFinance();
  const [step, setStep] = useState(1);

  // STEP 1 State: Receitas e Benefícios
  const [salario, setSalario] = useState<number>(0);
  const [salarioDia, setSalarioDia] = useState<number>(5);
  const [vale, setVale] = useState<number>(0);
  const [valeDia, setValeDia] = useState<number>(20);
  const [va, setVa] = useState<number>(0);
  const [vaDia, setVaDia] = useState<number>(1);
  const [vr, setVr] = useState<number>(0);
  const [vrDia, setVrDia] = useState<number>(1);
  const [venderBeneficiosPix, setVenderBeneficiosPix] = useState<boolean>(false);
  const [extraBenefits] = useState<ExtraBenefit[]>([]);

  // STEP 2 State: Gastos e Divisão
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: "exp-1", name: "Moradia (Aluguel/Financiamento)", value: 0, dueDay: 5, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-2", name: "Condomínio", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-3", name: "Energia Elétrica", value: 0, dueDay: 15, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-5", name: "Internet", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-6", name: "Supermercado", value: 0, dueDay: 20, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
  ]);

  // Modal / Form state for adding a new expense
  const [showAddExpenseSheet, setShowAddExpenseSheet] = useState(false);
  const [newExpName, setNewExpName] = useState("");
  const [newExpValue, setNewExpValue] = useState("");
  const [newExpDueDay, setNewExpDueDay] = useState(10);
  const [newExpSplitEnabled, setNewExpSplitEnabled] = useState(false);
  const [newExpSplitType, setNewExpSplitType] = useState<"50-50" | "custom">("50-50");
  const [newExpSplitPercentage, setNewExpSplitPercentage] = useState(50);
  const [newExpSplitWith, setNewExpSplitWith] = useState("");

  const [sharedHousemateName, setSharedHousemateName] = useState("");

  // Add Expense form handler - places new item at the TOP of the list
  const handleSaveNewExpense = () => {
    if (!newExpName.trim()) {
      toast.error("Informe a descrição da conta!");
      return;
    }
    const valNum = parseFloat(newExpValue.replace(",", "."));
    if (isNaN(valNum) || valNum <= 0) {
      toast.error("Informe um valor válido!");
      return;
    }

    const housemateName = newExpSplitWith.trim() || sharedHousemateName;
    if (housemateName && housemateName !== sharedHousemateName) {
      setSharedHousemateName(housemateName);
    }

    const newId = `exp-custom-${Date.now()}`;
    const newItem: ExpenseItem = {
      id: newId,
      name: newExpName.trim(),
      value: valNum,
      dueDay: newExpDueDay,
      splitEnabled: newExpSplitEnabled,
      splitType: newExpSplitType,
      splitPercentage: newExpSplitPercentage,
      splitWith: housemateName,
    };

    // Push newest to the top so user sees it instantly without scrolling, and sync housemate name
    setExpenses([
      newItem,
      ...expenses.map((e) => ({
        ...e,
        splitWith: e.splitWith || housemateName,
      })),
    ]);

    // Reset form
    setNewExpName("");
    setNewExpValue("");
    setNewExpDueDay(10);
    setNewExpSplitEnabled(false);
    setNewExpSplitType("50-50");
    setNewExpSplitPercentage(50);
    setNewExpSplitWith("");
    setShowAddExpenseSheet(false);

    toast.success("Nova despesa adicionada com sucesso!");
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleUpdateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    let nextSharedName = sharedHousemateName;

    if (updates.splitWith !== undefined) {
      nextSharedName = updates.splitWith;
      setSharedHousemateName(nextSharedName);
    }

    setExpenses((prevExpenses) => {
      const currentItem = prevExpenses.find((e) => e.id === id);
      const isEnablingSplit = updates.splitEnabled === true;

      let targetSplitWith: string | undefined = undefined;
      if (updates.splitWith !== undefined) {
        targetSplitWith = updates.splitWith;
      } else if (isEnablingSplit && (!currentItem?.splitWith || !currentItem.splitWith.trim())) {
        targetSplitWith = nextSharedName;
      }

      return prevExpenses.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            ...updates,
            ...(targetSplitWith !== undefined ? { splitWith: targetSplitWith } : {}),
          };
        }
        // Synchronize housemate name across all expenses so user only types once
        if (updates.splitWith !== undefined) {
          return {
            ...e,
            splitWith: nextSharedName,
          };
        }
        return e;
      });
    });
  };

  // Finalize onboarding and convert inputs into real database entries
  const handleFinalize = () => {
    const currentMonthLabel = state.currentMonth || "Jul";
    const txsToInsert: Transaction[] = [];

    // Pagamento (salário)
    if (salario > 0) {
      txsToInsert.push({
        id: `tx-salary-${Date.now()}`,
        desc: "Pagamento",
        cat: "Renda",
        month: currentMonthLabel,
        date: `${String(salarioDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: salario,
        type: "in",
        bucket: "variavel",
      });
    }

    // Adiantamento Salarial
    if (vale > 0) {
      txsToInsert.push({
        id: `tx-vale-${Date.now()}`,
        desc: "Adiantamento Salarial",
        cat: "Renda",
        month: currentMonthLabel,
        date: `${String(valeDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: vale,
        type: "in",
        bucket: "variavel",
      });
    }

    // VA (Vale Alimentação)
    if (va > 0) {
      txsToInsert.push({
        id: `tx-va-${Date.now()}`,
        desc: venderBeneficiosPix ? "Venda VA (Recebido via Pix)" : "Vale Alimentação (VA)",
        cat: venderBeneficiosPix ? "Renda" : "Benefícios",
        month: currentMonthLabel,
        date: `${String(vaDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: va,
        type: "in",
        bucket: "variavel",
      });
    }

    // VR (Vale Refeição)
    if (vr > 0) {
      txsToInsert.push({
        id: `tx-vr-${Date.now()}`,
        desc: venderBeneficiosPix ? "Venda VR (Recebido via Pix)" : "Vale Refeição (VR)",
        cat: venderBeneficiosPix ? "Renda" : "Benefícios",
        month: currentMonthLabel,
        date: `${String(vrDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: vr,
        type: "in",
        bucket: "variavel",
      });
    }

    // Extra benefits
    extraBenefits.forEach((b) => {
      if (b.name.trim() && b.value > 0) {
        txsToInsert.push({
          id: `tx-extra-benefit-${b.id}`,
          desc: b.name.trim(),
          cat: "Benefícios",
          month: currentMonthLabel,
          date: `${String(b.dueDay).padStart(2, "0")} ${currentMonthLabel}`,
          value: b.value,
          type: "in",
          bucket: "variavel",
        });
      }
    });

    // Determine partner name entered during onboarding
    const partnerNameFromOnboarding = sharedHousemateName.trim() || expenses.find((e) => e.splitEnabled && e.splitWith?.trim())?.splitWith?.trim() || "";
    if (partnerNameFromOnboarding) {
      try {
        localStorage.setItem("finance-partner-name", partnerNameFromOnboarding);
      } catch {}
    }

    // Fixed expenses
    expenses.forEach((e, idx) => {
      if (!e.name.trim() || e.value <= 0) return;

      const finalValueForUser = e.splitEnabled
        ? e.value * (1 - e.splitPercentage / 100)
        : e.value;

      txsToInsert.push({
        id: `tx-fixed-${idx}-${Date.now()}`,
        desc: e.name,
        cat: "Fixas",
        month: currentMonthLabel,
        date: `${String(e.dueDay).padStart(2, "0")} ${currentMonthLabel}`,
        value: -finalValueForUser,
        type: "out",
        bucket: "fixo",
        isSplit: e.splitEnabled,
        splitPercent: e.splitEnabled ? e.splitPercentage : undefined,
        splitWith: e.splitEnabled ? e.splitWith || partnerNameFromOnboarding || "Parceiro(a)" : undefined,
        originalValue: e.splitEnabled ? -e.value : undefined,
      });
    });

    // Save state
    dispatch({ type: "CLEAR_ALL_DATA" });
    dispatch({ type: "ADD_TXS", txs: txsToInsert });
    toast.success(`${txsToInsert.length} lançamentos configurados com sucesso!`);

    onComplete();
  };

  const totalIncome = salario + vale + va + extraBenefits.reduce((acc, b) => acc + b.value, 0);
  const totalExpensesGross = expenses.reduce((acc, e) => acc + e.value, 0);
  const totalExpensesUserShare = expenses.reduce((acc, e) => {
    const part = e.splitEnabled ? e.value * (1 - e.splitPercentage / 100) : e.value;
    return acc + part;
  }, 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-4 relative flex flex-col items-center justify-start px-3 pt-2 md:pt-6">
      {/* Background Glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-emerald-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-violet-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
            ⚡
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
            Onboarding de Finanças
          </span>
        </div>
        <button
          onClick={onBackToDashboard}
          className="text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={12} /> Voltar ao Início
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-card/45 backdrop-blur-xl border border-border/65 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Progress Bar */}
        <div className="w-full bg-muted/20 h-1 relative">
          <div
            className="bg-gradient-to-r from-emerald-500 to-violet-500 h-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step Title Header */}
        <div className="p-4 pb-2.5 flex justify-between items-center border-b border-border/20">
          <div>
            <h1 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
              {step === 1 && (
                <>
                  <TrendingUp size={16} className="text-green-500" />
                  Receitas e Benefícios
                </>
              )}
              {step === 2 && (
                <>
                  <Users size={16} className="text-violet-500" />
                  Despesas Fixas e Divisão
                </>
              )}
              {step === 3 && (
                <>
                  <DollarSign size={16} className="text-amber-500" />
                  Resumo Financeiro Pessoal
                </>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {step === 1 && "Configure sua renda e benefícios mensais."}
              {step === 2 && "Cadastre suas contas recorrentes e ative a divisão inteligente de gastos."}
              {step === 3 && "Confira o resumo das suas finanças. Você pode ajustar, excluir ou adicionar qualquer item abaixo."}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md shrink-0">
            Passo {step} de 3
          </span>
        </div>

        {/* Step Content */}
        <div className="p-3.5 md:p-5 flex-1">
          <AnimatePresence mode="wait">
            {/* STEP 1: Receitas e Benefícios */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5"
              >
                {/* Pagamento (Salário Líquido) */}
                <div className="p-2.5 rounded-xl border border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                      <DollarSign size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Pagamento</label>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={salario || ""}
                        onChange={(e) => setSalario(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500/50 font-semibold"
                      />
                    </div>
                    <DayPickerSelect value={salarioDia} onChange={setSalarioDia} focusBorderColor="focus:border-emerald-500/50" />
                  </div>
                </div>

                {/* Adiantamento Salarial */}
                <div className="p-2.5 rounded-xl border border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <DollarSign size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">
                      Adiantamento Salarial <span className="text-[9px] text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={vale || ""}
                        onChange={(e) => setVale(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500/50 font-semibold"
                      />
                    </div>
                    <DayPickerSelect value={valeDia} onChange={setValeDia} focusBorderColor="focus:border-emerald-500/50" />
                  </div>
                </div>

                {/* Vale Alimentação (VA) */}
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                      <Briefcase size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">
                      Vale Alimentação (VA) <span className="text-[9px] text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={va || ""}
                        onChange={(e) => setVa(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-violet-500/50 font-semibold"
                      />
                    </div>
                    <DayPickerSelect value={vaDia} onChange={setVaDia} focusBorderColor="focus:border-violet-500/50" />
                  </div>
                </div>

                {/* Vale Refeição (VR) */}
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                      <Utensils size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">
                      Vale Refeição (VR) <span className="text-[9px] text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={vr || ""}
                        onChange={(e) => setVr(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-violet-500/50 font-semibold"
                      />
                    </div>
                    <DayPickerSelect value={vrDia} onChange={setVrDia} focusBorderColor="focus:border-violet-500/50" />
                  </div>
                </div>

                {/* Botão Interativo: Vender Benefício (Receber via Pix) */}
                <button
                  type="button"
                  onClick={() => setVenderBeneficiosPix(!venderBeneficiosPix)}
                  className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer select-none mt-1 ${
                    venderBeneficiosPix
                      ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-violet-400/50 shadow-md shadow-violet-500/20 scale-[1.01]"
                      : "bg-muted/15 hover:bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className={venderBeneficiosPix ? "animate-spin-slow text-violet-200" : ""} />
                    <span>🔄 Vender benefício (Receber via Pix)</span>
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-wide ${
                    venderBeneficiosPix ? "bg-white/20 text-white" : "bg-muted/60 text-muted-foreground"
                  }`}>
                    {venderBeneficiosPix ? "Ativo (Entra como Renda Pix)" : "Inativo"}
                  </span>
                </button>
              </motion.div>
            )}

            {/* STEP 2: Despesas Fixas e Divisão */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-muted-foreground">Suas Contas Recorrentes</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sharedHousemateName && !newExpSplitWith) {
                        setNewExpSplitWith(sharedHousemateName);
                      }
                      setShowAddExpenseSheet(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-extrabold text-primary-foreground bg-primary hover:bg-primary/90 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus size={13} strokeWidth={2.8} /> Adicionar Despesa
                  </button>
                </div>

                {/* Active Expenses List - Newest on TOP */}
                <div id="expenses-list-container" className="space-y-2">
                  {expenses.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-border/50 rounded-xl text-muted-foreground text-xs">
                      Nenhuma despesa cadastrada ainda. Clique em "Adicionar Despesa" acima.
                    </div>
                  ) : (
                    expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-2.5 rounded-xl border border-border/30 bg-card/40 hover:bg-card/70 hover:border-border/50 transition-all flex flex-col gap-1.5 shadow-xs"
                      >
                        {/* Main Horizontal Row */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Left Side: Expense Name & Compressed Value (R$ 0,00) */}
                          <div className="flex flex-col flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="Nome da despesa"
                              value={exp.name}
                              onChange={(e) => handleUpdateExpense(exp.id, { name: e.target.value })}
                              className="bg-transparent text-xs font-bold text-foreground outline-none border-b border-transparent focus:border-violet-500/50 transition-colors w-full truncate placeholder:text-muted-foreground/50 py-0.5"
                            />
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                              <span className="text-[9px] font-bold text-muted-foreground/80">R$</span>
                              <input
                                type="number"
                                placeholder="0,00"
                                value={exp.value || ""}
                                onChange={(e) => handleUpdateExpense(exp.id, { value: Number(e.target.value) })}
                                className="bg-transparent text-[11px] font-semibold text-foreground/90 outline-none w-20 border-b border-transparent focus:border-violet-500/50 py-0"
                              />
                            </div>
                          </div>

                          {/* Right Side: Day Picker, Smart Split Icon, Trash */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Day Selector */}
                            <DayPickerSelect
                              value={exp.dueDay}
                              onChange={(val) => handleUpdateExpense(exp.id, { dueDay: val })}
                              focusBorderColor="focus:border-violet-500/50"
                            />

                            {/* Smart Split Icon Toggle */}
                            <button
                              type="button"
                              onClick={() => handleUpdateExpense(exp.id, { splitEnabled: !exp.splitEnabled })}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                exp.splitEnabled
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs"
                                  : "bg-muted/30 text-muted-foreground/60 border-border/30 hover:text-foreground hover:bg-muted/50"
                              }`}
                              title={exp.splitEnabled ? "Divisão ativa (Clique para desativar)" : "Ativar divisão inteligente"}
                            >
                              <Users size={13} />
                            </button>

                            {/* Trash Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveExpense(exp.id)}
                              className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                              title="Remover Despesa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Compact Expandable Sub-bar for Split Options when Split is Enabled */}
                        {exp.splitEnabled && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] text-muted-foreground mt-0.5">
                            <div className="flex items-center border border-border/30 rounded-md bg-background/60 overflow-hidden shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateExpense(exp.id, { splitType: "50-50", splitPercentage: 50 })}
                                className={`px-1.5 py-0.5 text-[9px] font-bold transition-all cursor-pointer ${
                                  exp.splitType === "50-50" ? "bg-purple-500 text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                50/50
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateExpense(exp.id, { splitType: "custom" })}
                                className={`px-1.5 py-0.5 text-[9px] font-bold transition-all cursor-pointer ${
                                  exp.splitType === "custom" ? "bg-purple-500 text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                %
                              </button>
                            </div>

                            {exp.splitType === "custom" && (
                              <div className="flex items-center gap-0.5 bg-background/60 px-1.5 py-0.5 rounded-md border border-border/30 shrink-0">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={exp.splitPercentage}
                                  onChange={(e) => handleUpdateExpense(exp.id, { splitPercentage: Math.max(1, Math.min(99, Number(e.target.value))) })}
                                  className="w-7 bg-transparent text-[10px] font-bold text-foreground text-center outline-none"
                                />
                                <span className="text-[9px] text-muted-foreground font-semibold">% dele(a)</span>
                              </div>
                            )}

                            <input
                              type="text"
                              placeholder="Nome (Ex: Parceiro(a))"
                              value={exp.splitWith}
                              onChange={(e) => handleUpdateExpense(exp.id, { splitWith: e.target.value })}
                              className="bg-transparent border-b border-border/30 text-[10px] text-foreground font-medium outline-none focus:border-purple-500 flex-1 min-w-[80px] px-1 py-0.5 placeholder:text-muted-foreground/40"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Resumo Financeiro Pessoal (Interactive) */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Visual Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-green-500/15 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-500">Receitas Totais</span>
                    <span className="text-base font-extrabold text-green-500 mt-1">{money(totalIncome)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-red-500/15 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">Despesas Brutas</span>
                    <span className="text-base font-extrabold text-rose-400 mt-1">{money(totalExpensesGross)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Sua Parcela Estimada</span>
                    <span className="text-base font-extrabold text-violet-400 mt-1">{money(totalExpensesUserShare)}</span>
                  </div>
                </div>

                {/* Section 1: Income Items Summary (Editable) */}
                <div className="p-4 rounded-2xl border border-border/40 bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" />
                      Receitas e Benefícios Cadastrados
                    </span>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} /> Ajustar no Passo 1
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {salario > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-semibold text-foreground">Pagamento</span>
                        <span className="font-bold text-emerald-500">{money(salario)} (Dia {salarioDia})</span>
                      </div>
                    )}
                    {vale > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-semibold text-foreground">Adiantamento Salarial</span>
                        <span className="font-bold text-emerald-500">{money(vale)} (Dia {valeDia})</span>
                      </div>
                    )}
                    {va > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-semibold text-foreground">Vale Alimentação (VA)</span>
                        <span className="font-bold text-violet-400">{money(va)} (Dia {vaDia})</span>
                      </div>
                    )}
                    {extraBenefits.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <span className="font-semibold text-foreground">{b.name || "Outro Benefício"}</span>
                        <span className="font-bold text-purple-400">{money(b.value)} (Dia {b.dueDay})</span>
                      </div>
                    ))}
                    {totalIncome === 0 && (
                      <span className="text-muted-foreground text-xs italic">Nenhuma receita informada ainda.</span>
                    )}
                  </div>
                </div>

                {/* Section 2: Fixed Expenses Summary (Editable & Addable) */}
                <div className="p-4 rounded-2xl border border-border/40 bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <Users size={14} className="text-violet-500" />
                      Despesas Fixas ({expenses.length})
                    </span>
                    <button
                      onClick={() => setShowAddExpenseSheet(true)}
                      className="text-[10px] font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {expenses.length === 0 ? (
                      <span className="text-muted-foreground text-xs italic">Nenhuma despesa adicionada.</span>
                    ) : (
                      expenses.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/10 text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{e.name || "Sem nome"}</span>
                            <span className="text-[10px] text-muted-foreground">
                              Vence dia {e.dueDay} {e.splitEnabled ? `• Dividido (${e.splitPercentage}% seu)` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-400">{money(e.value)}</span>
                            <button
                              onClick={() => handleRemoveExpense(e.id)}
                              className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="p-4 bg-muted/20 border-t border-border/10 flex items-center justify-between">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                onBackToDashboard();
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 transition-colors cursor-pointer"
          >
            {step === 1 ? "Cancelar" : "Voltar"}
          </button>

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && salario <= 0) {
                  toast.error("Por favor, preencha o seu pagamento.");
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-violet-600 hover:from-emerald-400 hover:to-violet-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Continuar <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-violet-600 hover:from-emerald-400 hover:to-violet-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <CheckCircle2 size={14} /> Concluir e Aplicar Lançamentos
            </button>
          )}
        </div>
      </div>

      {/* Sheet for Adding New Expense (Adicionar Despesa) */}
      <BottomSheet open={showAddExpenseSheet} onClose={() => setShowAddExpenseSheet(false)}>
        <div className="flex flex-col gap-4 pt-1 pb-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-extrabold text-foreground">Adicionar Nova Despesa</h2>
            <button
              onClick={() => setShowAddExpenseSheet(false)}
              className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Descrição */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Descrição da Conta</label>
              <input
                type="text"
                placeholder="Ex: Financiamento da Casa, Internet, Luz"
                value={newExpName}
                onChange={(e) => setNewExpName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary font-semibold"
              />
            </div>

            {/* Valor & Vencimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Valor Estimado (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={newExpValue}
                  onChange={(e) => setNewExpValue(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Dia do Vencimento</label>
                <DayPickerSelect value={newExpDueDay} onChange={setNewExpDueDay} className="w-full" />
              </div>
            </div>

            {/* Divisão */}
            <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Dividir essa despesa?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExpSplitEnabled}
                    onChange={(e) => setNewExpSplitEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {newExpSplitEnabled && (
                <div className="space-y-2 pt-1 border-t border-border/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setNewExpSplitType("50-50"); setNewExpSplitPercentage(50); }}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                        newExpSplitType === "50-50" ? "bg-violet-500 text-white border-violet-500" : "bg-card border-border text-muted-foreground"
                      }`}
                    >
                      50% / 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewExpSplitType("custom")}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                        newExpSplitType === "custom" ? "bg-violet-500 text-white border-violet-500" : "bg-card border-border text-muted-foreground"
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {newExpSplitType === "custom" && (
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Porcentagem dele(a)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={newExpSplitPercentage}
                        onChange={(e) => setNewExpSplitPercentage(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Nome do Parceiro(a)</label>
                    <input
                      type="text"
                      placeholder="Ex: Nome da pessoa"
                      value={newExpSplitWith}
                      onChange={(e) => setNewExpSplitWith(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExpenseSheet(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewExpense}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Adicionar Despesa
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
