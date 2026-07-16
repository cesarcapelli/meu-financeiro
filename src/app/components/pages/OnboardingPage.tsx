import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Code,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "../../store/finance-context";
import { money } from "../shared/currency";
import type { Transaction, Bucket } from "../../store/types";

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

interface OnboardingPageProps {
  onComplete: () => void;
  onBackToDashboard: () => void;
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

  // STEP 2 State: Gastos e Divisão
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: "exp-1", name: "Moradia (Aluguel/Financiamento)", value: 0, dueDay: 5, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-2", name: "Condomínio", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-3", name: "Energia Elétrica", value: 0, dueDay: 15, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-4", name: "Água", value: 0, dueDay: 15, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-5", name: "Internet / Celular", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-6", name: "Supermercado", value: 0, dueDay: 20, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
  ]);

  const [copied, setCopied] = useState(false);

  // Helpers to add and remove expenses
  const handleAddExpense = () => {
    const newId = `exp-custom-${Date.now()}-${Math.random()}`;
    setExpenses([
      ...expenses,
      {
        id: newId,
        name: "",
        value: 0,
        dueDay: 10,
        splitEnabled: false,
        splitType: "50-50",
        splitPercentage: 50,
        splitWith: "",
      },
    ]);
    setTimeout(() => {
      const container = document.getElementById('expenses-list-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleUpdateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  // Generate the data architecture schema as requested (REQUISITO 4)
  const generateJSONSchema = () => {
    const fixedExpensesSchema = expenses.map((e) => ({
      name: e.name || "Sem Nome",
      value: e.value,
      due_day: e.dueDay,
      is_recurring: true,
      split: {
        enabled: e.splitEnabled,
        partner: e.splitEnabled ? e.splitWith || "Aline" : "",
        percentage: e.splitEnabled ? e.splitPercentage : 0,
      },
    }));

    return {
      income: {
        salary: salario,
        salary_day: salarioDia,
        salary_advance: vale > 0 ? { amount: vale, day: valeDia } : null,
        benefits: {
          va: va > 0 ? { amount: va, day: vaDia } : null,
          vr: vr > 0 ? { amount: vr, day: vrDia } : null,
        },
      },
      fixed_expenses: fixedExpensesSchema,
    };
  };

  const jsonSchemaText = JSON.stringify(generateJSONSchema(), null, 2);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonSchemaText);
    setCopied(true);
    toast.success("Esquema JSON copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle final save: actually convert entries into real database-like transactions!
  const handleFinalize = () => {
    const currentMonthLabel = state.currentMonth || "Jul";
    const txsToInsert: Transaction[] = [];

    // Add Salary (income)
    if (salario > 0) {
      txsToInsert.push({
        id: `tx-salary-${Date.now()}`,
        desc: "Salário Líquido / Pagamento",
        cat: "Renda",
        month: currentMonthLabel,
        date: `${String(salarioDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: salario,
        type: "in",
        bucket: "variavel",
      });
    }

    // Add Vale (advance)
    if (vale > 0) {
      txsToInsert.push({
        id: `tx-vale-${Date.now()}`,
        desc: "Adiantamento (Vale)",
        cat: "Renda",
        month: currentMonthLabel,
        date: `${String(valeDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: vale,
        type: "in",
        bucket: "variavel",
      });
    }

    // Add VA if provided
    if (va > 0) {
      txsToInsert.push({
        id: `tx-va-${Date.now()}`,
        desc: "Vale Alimentação (VA)",
        cat: "Benefícios",
        month: currentMonthLabel,
        date: `${String(vaDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: va,
        type: "in",
        bucket: "variavel",
      });
    }

    // Add VR if provided
    if (vr > 0) {
      txsToInsert.push({
        id: `tx-vr-${Date.now()}`,
        desc: "Vale Refeição (VR)",
        cat: "Benefícios",
        month: currentMonthLabel,
        date: `${String(vrDia).padStart(2, "0")} ${currentMonthLabel}`,
        value: vr,
        type: "in",
        bucket: "variavel",
      });
    }

    // Add fixed expenses (taking care of splits!)
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
        value: -finalValueForUser, // negative since it's an expense
        type: "out",
        bucket: "fixo",
        isSplit: e.splitEnabled,
        splitPercent: e.splitEnabled ? e.splitPercentage : undefined,
        splitWith: e.splitEnabled ? e.splitWith || "Aline" : undefined,
        originalValue: e.splitEnabled ? -e.value : undefined,
      });
    });

    if (txsToInsert.length > 0) {
      // Clear previous mockup state before inserting onboarding to make it pristine
      dispatch({ type: "CLEAR_ALL_DATA" });
      dispatch({ type: "ADD_TXS", txs: txsToInsert });
      toast.success(`${txsToInsert.length} lançamentos de primeiro acesso inseridos com sucesso!`);
    }

    onComplete();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 relative flex flex-col items-center justify-start px-4 pt-4 md:pt-12">
      {/* Glow Bubbles */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-emerald-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-violet-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Header Fino */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
            ⚡
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
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

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-2xl bg-card/45 backdrop-blur-xl border border-border/65 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* PROGRESS BAR SUTIL (REQUISITO 1) */}
        <div className="w-full bg-muted/20 h-1 relative">
          <div
            className="bg-gradient-to-r from-emerald-500 to-violet-500 h-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP HEADER */}
        <div className="p-6 pb-2 flex justify-between items-center border-b border-border/20">
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
              {step === 1 && (
                <>
                  <TrendingUp size={18} className="text-green-500" />
                  Receitas e Benefícios
                </>
              )}
              {step === 2 && (
                <>
                  <Users size={18} className="text-violet-500" />
                  Despesas Fixas e Divisão
                </>
              )}
              {step === 3 && (
                <>
                  <Code size={18} className="text-amber-500" />
                  Resumo e Arquitetura de Dados
                </>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1 && "Configure suas receitas principais e vales corporativos mensais."}
              {step === 2 && "Cadastre suas contas recorrentes e ative a divisão inteligente de gastos."}
              {step === 3 && "Visualize a estimativa mensal e a estrutura de dados em formato JSON."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
            Passo {step} de 3
          </span>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="p-6 flex-1 min-h-[380px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Salário Líquido */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                      <DollarSign size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Salário Líquido Mensal</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={salario || ""}
                        onChange={(e) => setSalario(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all font-semibold"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Dia de Recebimento</label>
                      <select
                        value={salarioDia}
                        onChange={(e) => setSalarioDia(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card">Dia {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Adiantamento (Vale) */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <DollarSign size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Adiantamento (Vale) <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={vale || ""}
                        onChange={(e) => setVale(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all font-semibold"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Dia de Recebimento</label>
                      <select
                        value={valeDia}
                        onChange={(e) => setValeDia(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card">Dia {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vale Alimentação (VA) */}
                <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center">
                      <Briefcase size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Vale Alimentação (VA) <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="Não possuo"
                        value={va || ""}
                        onChange={(e) => setVa(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-violet-500/50 transition-all font-semibold"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Dia de Recebimento</label>
                      <select
                        value={vaDia}
                        onChange={(e) => setVaDia(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-violet-500/50 transition-all cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card">Dia {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vale Refeição (VR) */}
                <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Briefcase size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Vale Refeição (VR) <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="Não possuo"
                        value={vr || ""}
                        onChange={(e) => setVr(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-500/50 transition-all font-semibold"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Dia de Recebimento</label>
                      <select
                        value={vrDia}
                        onChange={(e) => setVrDia(Number(e.target.value))}
                        className="w-full bg-background/30 border border-border/40 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-amber-500/50 transition-all cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card">Dia {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Suas Contas Recorrentes</span>
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md transition-all cursor-pointer z-10"
                  >
                    <Plus size={11} /> Adicionar Despesa
                  </button>
                </div>

                <div id="expenses-list-container" className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {expenses.map((exp, index) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl border border-border/30 bg-muted/10 hover:border-border/50 transition-all relative space-y-3"
                    >
                      {/* Close button */}
                      <button
                        onClick={() => handleRemoveExpense(exp.id)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground/60 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remover Despesa"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Header da despesa */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pr-6">
                        {/* Nome */}
                        <div className="md:col-span-6 relative">
                          <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Descrição da Conta</label>
                          <input
                            type="text"
                            placeholder="Ex: Financiamento da Casa"
                            value={exp.name}
                            onChange={(e) => handleUpdateExpense(exp.id, { name: e.target.value })}
                            className="w-full bg-background border border-border/30 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-500/50 transition-all font-semibold"
                          />
                        </div>

                        {/* Valor Estimado */}
                        <div className="md:col-span-4 relative">
                          <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Valor Estimado</label>
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                          <input
                            type="number"
                            placeholder="0,00"
                            value={exp.value || ""}
                            onChange={(e) => handleUpdateExpense(exp.id, { value: Number(e.target.value) })}
                            className="w-full bg-background border border-border/30 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-violet-500/50 transition-all font-semibold"
                          />
                        </div>

                        {/* Vencimento */}
                        <div className="md:col-span-2 relative">
                          <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Venc.</label>
                          <select
                            value={exp.dueDay}
                            onChange={(e) => handleUpdateExpense(exp.id, { dueDay: Number(e.target.value) })}
                            className="w-full bg-background border border-border/30 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-500/50 transition-all cursor-pointer font-medium"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d} className="bg-card">{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* COMPONENTE DE DIVISÃO DE GASTOS (REQUISITO 3) */}
                      <div className="border-t border-border/10 pt-2.5 mt-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Users size={10} className="text-violet-500" />
                            Deseja dividir essa conta com alguém?
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.splitEnabled}
                              onChange={(e) => handleUpdateExpense(exp.id, { splitEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-7 h-4 bg-muted border border-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                            <span className="ml-1.5 text-[9px] font-bold text-foreground">Dividir</span>
                          </label>
                        </div>

                        {/* Ao ativar o toggle */}
                        {exp.splitEnabled && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap md:flex-nowrap items-center gap-3 p-2 bg-muted/30 border border-border/10 rounded-lg transition-all"
                          >
                            {/* Botões de Divisão */}
                            <div className="flex items-center border border-border/20 rounded-md overflow-hidden bg-background">
                              <button
                                onClick={() => handleUpdateExpense(exp.id, { splitType: "50-50", splitPercentage: 50 })}
                                className={`text-[9px] font-bold px-2 py-1 transition-all cursor-pointer ${
                                  exp.splitType === "50-50"
                                    ? "bg-violet-500 text-white"
                                    : "text-muted-foreground hover:bg-muted/40"
                                }`}
                              >
                                50% / 50%
                              </button>
                              <button
                                onClick={() => handleUpdateExpense(exp.id, { splitType: "custom" })}
                                className={`text-[9px] font-bold px-2 py-1 transition-all cursor-pointer ${
                                  exp.splitType === "custom"
                                    ? "bg-violet-500 text-white"
                                    : "text-muted-foreground hover:bg-muted/40"
                                }`}
                              >
                                Personalizado
                              </button>
                            </div>

                            {/* Input de Porcentagem Customizada se selecionado */}
                            {exp.splitType === "custom" && (
                              <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border border-border/20">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={exp.splitPercentage}
                                  onChange={(e) => handleUpdateExpense(exp.id, { splitPercentage: Math.max(1, Math.min(99, Number(e.target.value))) })}
                                  className="w-8 bg-transparent text-[10px] font-bold text-foreground text-center outline-none"
                                />
                                <span className="text-[9px] text-muted-foreground font-bold">% dele(a)</span>
                              </div>
                            )}

                            {/* Nome de quem divide */}
                            <div className="flex-1 min-w-[120px] relative">
                              <label className="absolute -top-2 left-2 px-1 text-[7px] font-bold text-muted-foreground bg-card">Nome do Parceiro(a)</label>
                              <input
                                type="text"
                                placeholder="Ex: Aline"
                                value={exp.splitWith}
                                onChange={(e) => handleUpdateExpense(exp.id, { splitWith: e.target.value })}
                                className="w-full bg-background border border-border/20 rounded px-2 py-1 text-[10px] outline-none focus:border-violet-500 font-semibold"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Visual Cards Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-green-500/10 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-500">Receitas Totais</span>
                    <span className="text-sm font-extrabold text-green-500 mt-1">{money(salario + vale + va + vr)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-red-500/10 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">Despesas Brutas</span>
                    <span className="text-sm font-extrabold text-rose-400 mt-1">
                      {money(expenses.reduce((acc, curr) => acc + curr.value, 0))}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Sua Parcela Estimada</span>
                    <span className="text-sm font-extrabold text-violet-400 mt-1">
                      {money(
                        expenses.reduce((acc, curr) => {
                          const part = curr.splitEnabled
                            ? curr.value * (1 - curr.splitPercentage / 100)
                            : curr.value;
                          return acc + part;
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* SCHEMATIC JSON GRAPH (REQUISITO 4) */}
                <div className="border border-border/40 rounded-xl overflow-hidden bg-background/80 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[8px] font-bold">
                        {}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wide">
                        esquema_financeiro_onboarding.json
                      </span>
                    </div>
                    <button
                      onClick={handleCopyJSON}
                      className="text-[9px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                      {copied ? "Copiado!" : "Copiar Esquema"}
                    </button>
                  </div>
                  <div className="p-3 font-mono text-[9px] leading-relaxed text-amber-400 overflow-x-auto max-h-[220px] bg-slate-950/60">
                    <pre>{jsonSchemaText}</pre>
                  </div>
                </div>

                {/* Warning note */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-2">
                  <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong className="text-blue-400">Pronto para começar!</strong> Ao clicar em <strong className="text-foreground">Concluir e Aplicar</strong>, o app apagará os dados de demonstração iniciais e preencherá seu perfil instantaneamente com os saldos reais e lançamentos que você acabou de configurar acima.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION ROW (REQUISITO 1) */}
        <div className="p-4 bg-muted/20 border-t border-border/10 flex items-center justify-between">
          {/* Voltar (link discreto) */}
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

          {/* Continuar / Concluir (botão de destaque verde/roxo) */}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && salario <= 0) {
                  toast.error("Por favor, preencha o seu salário líquido.");
                  return;
                }
                if (step === 2) {
                  const emptyExp = expenses.some((e) => !e.name.trim());
                  if (emptyExp) {
                    toast.error("Por favor, preencha o nome de todas as contas ou remova as que estão em branco.");
                    return;
                  }
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
              <CheckCircle2 size={13} /> Concluir e Aplicar Lançamentos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
