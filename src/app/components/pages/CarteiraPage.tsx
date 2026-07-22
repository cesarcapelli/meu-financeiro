import React, { useState } from "react";
import {
  Plus,
  CreditCard,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  ArrowRightLeft,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useFinance } from "../../store/finance-context";
import { txForMonth } from "../../store/selectors";
import { fmt } from "../shared/currency";
import type { Transaction, Card } from "../../store/types";
import { motion, AnimatePresence } from "motion/react";

interface CarteiraPageProps {
  search: string;
  onOpenTx: (tx: Transaction) => void;
  onImport: () => void;
  onAddCard: () => void;
  onEditCard: (c: Card) => void;
}

const CATEGORY_OPTIONS = [
  "Renda",
  "Alimentação",
  "Moradia",
  "Contas",
  "Transporte",
  "Saúde",
  "Lazer",
  "Assinaturas",
  "Benefícios",
  "Educação",
  "Investimentos",
  "Outros",
];

const CATEGORY_COLORS: Record<string, string> = {
  Renda: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Alimentação: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Moradia: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  Contas: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Transporte: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Saúde: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Lazer: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  Assinaturas: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Benefícios: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
};

export function CarteiraPage({
  search,
  onOpenTx,
  onImport,
  onAddCard,
  onEditCard,
}: CarteiraPageProps) {
  const [activeTab, setActiveTab] = useState<"conta" | "cartoes">("conta");
  const { state, dispatch } = useFinance();
  const txs = txForMonth(state, state.currentMonth);

  // Filter for 'Conta Corrente'
  const contaCorrenteTxs = txs.filter((t) => !t.card || t.card === "Pix" || t.card === "");
  const searchLower = search.toLowerCase();
  const filteredConta = contaCorrenteTxs.filter(
    (t) =>
      t.desc.toLowerCase().includes(searchLower) ||
      (t.cat && t.cat.toLowerCase().includes(searchLower))
  );

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Transactions Sheet
      const allTransactions = (state.transactions && state.transactions.length > 0) ? state.transactions : txs;
      const txsData = (allTransactions && allTransactions.length > 0)
        ? allTransactions.map((t) => ({
            Data: t.date || "-",
            Mês: t.month || "-",
            Descrição: t.desc || "-",
            Categoria: t.cat || "Geral",
            "Valor (R$)": t.value ?? 0,
            Tipo: t.type === "in" ? "Entrada" : "Saída",
            "Forma / Cartão": t.card || "Conta Corrente",
            Dividido: t.isSplit ? "Sim" : "Não",
            "Valor Original (R$)": t.originalValue ?? Math.abs(t.value ?? 0),
          }))
        : [{
            Data: "-",
            Mês: state.currentMonth || "-",
            Descrição: "Nenhum lançamento cadastrado",
            Categoria: "-",
            "Valor (R$)": 0,
            Tipo: "-",
            "Forma / Cartão": "-",
            Dividido: "Não",
            "Valor Original (R$)": 0,
          }];

      const wsTxs = XLSX.utils.json_to_sheet(txsData);
      XLSX.utils.book_append_sheet(wb, wsTxs, "Transações");

      // 2. Credit Cards Sheet
      if (state.cards && state.cards.length > 0) {
        const cardsData = state.cards.map((c) => ({
          "Cartão / Banco": c.bank || "-",
          "Limite (R$)": c.limit ?? 0,
          "Fatura Atual (R$)": c.current ?? 0,
          "Dia Fechamento": c.closure || c.closing || "-",
          "Dia Vencimento": c.due || "-",
        }));
        const wsCards = XLSX.utils.json_to_sheet(cardsData);
        XLSX.utils.book_append_sheet(wb, wsCards, "Cartões");
      }

      // 3. Goals Sheet
      if (state.goals && state.goals.length > 0) {
        const goalsData = state.goals.map((g) => ({
          Meta: g.label || g.title || "-",
          "Valor Guardado (R$)": g.atual ?? g.current ?? 0,
          "Objetivo (R$)": g.total ?? g.target ?? 0,
          Prazo: g.deadline || "-",
        }));
        const wsGoals = XLSX.utils.json_to_sheet(goalsData);
        XLSX.utils.book_append_sheet(wb, wsGoals, "Metas");
      }

      // Safety check to ensure workbook always has at least one sheet
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        const wsEmpty = XLSX.utils.json_to_sheet([{ Info: "Sem dados para exportar no momento" }]);
        XLSX.utils.book_append_sheet(wb, wsEmpty, "Resumo");
      }

      const fileName = `financeiro_${(state.currentMonth || "extrato").toLowerCase().replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Dados exportados com sucesso: ${fileName}`);
    } catch (err) {
      console.error("Erro ao exportar para Excel:", err);
      toast.error("Ocorreu um erro ao gerar o arquivo Excel.");
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-20">
      {/* Top Bar with Tab Switch and Export */}
      <div className="flex items-center justify-between px-4 mt-2 gap-2">
        <div className="bg-muted p-1 rounded-2xl flex flex-1">
          <button
            onClick={() => setActiveTab("conta")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "conta"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Conta Corrente
          </button>
          <button
            onClick={() => setActiveTab("cartoes")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cartoes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Cartões de Crédito
          </button>
        </div>

        <button
          onClick={handleExportExcel}
          title="Exportar dados para Excel (.xlsx)"
          className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer border border-emerald-500/20 shadow-xs"
        >
          <FileSpreadsheet size={15} />
          <span className="hidden xs:inline">Exportar</span>
          <span className="text-[11px] opacity-90">.xlsx</span>
        </button>
      </div>

      <div className="px-4">
        {activeTab === "conta" ? (
          <ContaCorrenteTab
            txs={filteredConta}
            allContaTxs={contaCorrenteTxs}
            currentMonth={state.currentMonth}
            dispatch={dispatch}
            onOpenTx={onOpenTx}
            onImport={onImport}
          />
        ) : (
          <CartoesTab
            cards={state.cards}
            allTxs={txs}
            onAddCard={onAddCard}
            onEditCard={onEditCard}
            onOpenTx={onOpenTx}
          />
        )}
      </div>
    </div>
  );
}

function ContaCorrenteTab({
  txs,
  allContaTxs,
  currentMonth,
  dispatch,
  onOpenTx,
  onImport,
}: {
  txs: Transaction[];
  allContaTxs: Transaction[];
  currentMonth: string;
  dispatch: any;
  onOpenTx: (t: Transaction) => void;
  onImport: () => void;
}) {
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick Add Form State
  const [newDesc, setNewDesc] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCat, setNewCat] = useState("Alimentação");
  const [newType, setNewType] = useState<"in" | "out">("out");
  const [newDate, setNewDate] = useState(`15 ${currentMonth}`);

  // KPIs
  const totalIn = allContaTxs
    .filter((t) => t.value > 0)
    .reduce((sum, t) => sum + t.value, 0);
  const totalOut = allContaTxs
    .filter((t) => t.value < 0)
    .reduce((sum, t) => sum + Math.abs(t.value), 0);
  const totalBalance = totalIn - totalOut;

  // Filtered List
  const displayedTxs = txs.filter((t) => {
    if (filterType === "in" && t.value <= 0) return false;
    if (filterType === "out" && t.value >= 0) return false;
    if (filterCategory !== "todas" && t.cat !== filterCategory) return false;
    return true;
  });

  const handleAddQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) {
      toast.error("Informe a descrição do lançamento.");
      return;
    }
    const parsedVal = parseFloat(newValue.replace(",", "."));
    if (isNaN(parsedVal) || parsedVal <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }

    const finalVal = newType === "out" ? -Math.abs(parsedVal) : Math.abs(parsedVal);
    const newTx: Transaction = {
      id: `tx-quick-${Date.now()}`,
      desc: newDesc.trim(),
      value: finalVal,
      cat: newCat,
      type: newType,
      month: currentMonth,
      date: newDate.trim() || `15 ${currentMonth}`,
      bucket: newCat === "Moradia" || newCat === "Contas" ? "fixo" : "variavel",
      card: "Pix",
    };

    dispatch({ type: "ADD_TX", tx: newTx });
    toast.success("Lançamento adicionado com sucesso!");

    // Clear form
    setNewDesc("");
    setNewValue("");
  };

  return (
    <div className="space-y-4">
      {/* Didactic Summary Header (KPIs) */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500 animate-pulse" />
            <span className="text-xs font-extrabold text-foreground tracking-tight">
              Resumo Didático ({currentMonth})
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {allContaTxs.length} Lançamento{allContaTxs.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Receitas */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-2xl flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight size={10} /> Entradas
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {fmt(totalIn)}
            </span>
          </div>

          {/* Despesas */}
          <div className="bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-2xl flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <ArrowDownRight size={10} /> Saídas
            </span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {fmt(totalOut)}
            </span>
          </div>

          {/* Saldo Líquido */}
          <div className="bg-blue-500/5 border border-blue-500/20 p-2.5 rounded-2xl flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Saldo
            </span>
            <span
              className={`text-sm font-black mt-0.5 truncate ${
                totalBalance >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {fmt(totalBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Toggle Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 hover:from-emerald-500/20 hover:to-violet-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-xs"
        >
          <Plus size={14} />
          {showQuickAdd ? "Ocultar Formulário Rápido" : "+ Novo Lançamento Rápido na Tela"}
        </button>

        <button
          onClick={onImport}
          className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border border-border/40"
          title="Importar extrato CSV ou OFX"
        >
          <Upload size={13} />
          <span className="hidden sm:inline">Importar Extrato</span>
        </button>
      </div>

      {/* Inline Quick Add Form */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddQuickTransaction}
            className="bg-card border-2 border-emerald-500/30 rounded-3xl p-4 shadow-md space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" /> Adicionar Diretamente na
                Carteira
              </span>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Type Toggle */}
              <div className="sm:col-span-3 flex bg-muted p-0.5 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setNewType("out")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    newType === "out"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Saída (-)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("in")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    newType === "in"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Entrada (+)
                </button>
              </div>

              {/* Description */}
              <div className="sm:col-span-4 relative">
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Aluguel"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500/50 transition-all font-medium cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div className="sm:col-span-2 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-xl pl-7 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500/50 transition-all font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-muted-foreground">Data:</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-24 bg-background border border-border/40 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-foreground outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Check size={13} /> Salvar Lançamento
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Didactic Filters & Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/30">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              filterType === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType("in")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              filterType === "in"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-muted-foreground"
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType("out")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              filterType === "out" ? "bg-rose-500 text-white shadow-xs" : "text-muted-foreground"
            }`}
          >
            Saídas
          </button>
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-muted/50 border border-border/30 rounded-xl px-2 py-1 text-[11px] font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="todas">Todas Categoriass</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Editable Transactions */}
      {displayedTxs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center bg-card/40 rounded-3xl border border-dashed border-border/60">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Nenhum lançamento encontrado</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Altere o filtro acima ou clique em "+ Novo Lançamento Rápido na Tela".
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedTxs.map((t) => (
            <EditableTransactionRow
              key={t.id}
              t={t}
              isEditing={editingId === t.id}
              onStartEdit={() => setEditingId(t.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(updated) => {
                dispatch({ type: "UPDATE_TX", tx: updated });
                setEditingId(null);
                toast.success("Lançamento atualizado!");
              }}
              onDelete={() => {
                dispatch({ type: "DELETE_TX", id: t.id });
                toast.success("Lançamento excluído.");
              }}
              onToggleType={() => {
                const toggledVal = -t.value;
                const updated = {
                  ...t,
                  value: toggledVal,
                  type: toggledVal > 0 ? ("in" as const) : ("out" as const),
                };
                dispatch({ type: "UPDATE_TX", tx: updated });
                toast.info(`Alterado para ${toggledVal > 0 ? "Entrada" : "Saída"}`);
              }}
              onOpenTx={() => onOpenTx(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EditableTransactionRow({
  t,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleType,
  onOpenTx,
}: {
  t: Transaction;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updated: Transaction) => void;
  onDelete: () => void;
  onToggleType: () => void;
  onOpenTx: () => void;
}) {
  const [desc, setDesc] = useState(t.desc);
  const [cat, setCat] = useState(t.cat || "Outros");
  const [valStr, setValStr] = useState(String(Math.abs(t.value)));
  const [dateStr, setDateStr] = useState(t.date);
  const [isIncome, setIsIncome] = useState(t.value > 0);

  const handleSave = () => {
    const num = parseFloat(valStr.replace(",", "."));
    if (!desc.trim()) {
      toast.error("A descrição não pode ficar em branco.");
      return;
    }
    if (isNaN(num) || num <= 0) {
      toast.error("Insira um valor válido.");
      return;
    }
    const finalVal = isIncome ? Math.abs(num) : -Math.abs(num);
    onSaveEdit({
      ...t,
      desc: desc.trim(),
      cat,
      value: finalVal,
      date: dateStr.trim(),
      type: isIncome ? "in" : "out",
    });
  };

  const isPos = t.value > 0;
  const categoryBadgeClass =
    CATEGORY_COLORS[t.cat || ""] ||
    "bg-muted text-muted-foreground border-border/40";

  if (isEditing) {
    return (
      <div className="bg-card border-2 border-primary/50 p-3.5 rounded-2xl space-y-2.5 shadow-md animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
          <span className="text-[11px] font-extrabold text-primary flex items-center gap-1">
            <Edit2 size={11} /> Editando Lançamento
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsIncome(!isIncome)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition-all ${
                isIncome ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}
            >
              {isIncome ? "+ Entrada" : "- Saída"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Data */}
          <div className="sm:col-span-3">
            <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">Data</label>
            <input
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-primary"
            />
          </div>

          {/* Descrição */}
          <div className="sm:col-span-5">
            <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">
              Descrição
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-primary"
            />
          </div>

          {/* Categoria */}
          <div className="sm:col-span-4">
            <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">
              Categoria
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div className="sm:col-span-12 relative pt-1">
            <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">
              Valor (R$)
            </label>
            <input
              type="text"
              value={valStr}
              onChange={(e) => setValStr(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer transition-all"
          >
            <X size={12} /> Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition-all shadow-xs"
          >
            <Check size={12} /> Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 hover:border-border/90 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs transition-all group">
      {/* Left Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Date badge */}
        <div className="w-11 shrink-0 text-center py-1 px-1 bg-muted/40 rounded-xl border border-border/20">
          <span className="text-[10px] font-black text-muted-foreground leading-none block">
            {t.date.split(" ")[0]}
          </span>
          <span className="text-[8px] font-bold text-muted-foreground/80 uppercase block mt-0.5">
            {t.date.split(" ")[1] || t.month}
          </span>
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground truncate">{t.desc}</span>
            {t.cat && (
              <span
                className={`text-[9px] font-extrabold px-2 py-0.2 rounded-md border ${categoryBadgeClass}`}
              >
                {t.cat}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground/70 block mt-0.5">
            {t.card ? `Forma: ${t.card}` : "Conta Corrente"}
          </span>
        </div>
      </div>

      {/* Right Value & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <span
            className={`text-xs font-black block ${
              isPos ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isPos ? "+" : "-"}
            {fmt(Math.abs(t.value))}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 border-l border-border/40 pl-2">
          {/* Quick Type Invert Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleType();
            }}
            title="Inverter Entrada/Saída (+/-)"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <ArrowRightLeft size={12} />
          </button>

          {/* Inline Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            title="Editar lançamento diretamente"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Edit2 size={12} />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Excluir lançamento"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartoesTab({
  cards,
  allTxs,
  onAddCard,
  onEditCard,
  onOpenTx,
}: {
  cards: Card[];
  allTxs: Transaction[];
  onAddCard: () => void;
  onEditCard: (c: Card) => void;
  onOpenTx: (t: Transaction) => void;
}) {
  const [expandedCard, setExpandedCard] = useState<string | null>(
    cards.length > 0 ? cards[0].id : null
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard size={32} className="text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Nenhum cartão cadastrado</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Adicione seus cartões de crédito para acompanhar limites e faturas.
          </p>
        </div>
        <button
          onClick={onAddCard}
          className="mt-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform cursor-pointer"
        >
          Adicionar Cartão
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Meus Cartões
        </h3>
        <button
          onClick={onAddCard}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} /> Novo Cartão
        </button>
      </div>

      <div
        className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((c) => {
          const isActive = expandedCard === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setExpandedCard(c.id)}
              className={`snap-center shrink-0 w-[260px] h-[150px] p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all border ${
                isActive
                  ? "bg-card shadow-md border-primary scale-100"
                  : "bg-card/50 border-border opacity-70 scale-95"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-black text-foreground">{c.bank}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded-md">
                  Venc. {c.due}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Limite Disponível
                </p>
                <p className="text-lg font-black text-foreground">
                  {fmt(c.limit - c.current)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {expandedCard && (
          <motion.div
            key={expandedCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1 mt-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Detalhes da Fatura
              </h3>
            </div>

            <FaturaDetails
              cardId={expandedCard}
              cards={cards}
              allTxs={allTxs}
              onOpenTx={onOpenTx}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaturaDetails({
  cardId,
  cards,
  allTxs,
  onOpenTx,
}: {
  cardId: string;
  cards: Card[];
  allTxs: Transaction[];
  onOpenTx: (t: Transaction) => void;
}) {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return null;

  const cardTxs = allTxs.filter((t) => t.card === card.bank);

  const totalGeral = cardTxs.reduce(
    (sum, t) => sum + (t.originalValue || Math.abs(t.value)),
    0
  );
  const totalMyPart = cardTxs.reduce((sum, t) => sum + Math.abs(t.value), 0);

  if (cardTxs.length === 0) {
    return (
      <div className="bg-card border border-border p-6 rounded-2xl text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Fatura zerada neste mês.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="px-4 py-2 divide-y divide-border/50">
        {cardTxs.map((t) => (
          <div
            key={t.id}
            onClick={() => onOpenTx(t)}
            className="py-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 shrink-0 text-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-wide block leading-none">
                {t.date.split(" ")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate block">
                {t.desc}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {t.isSplit ? (
                <>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {fmt(t.originalValue || Math.abs(t.value))}
                  </span>
                  <span className="text-sm font-black text-primary">
                    {fmt(Math.abs(t.value))}
                  </span>
                </>
              ) : (
                <span
                  className={`text-sm font-bold ${
                    t.value < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {fmt(Math.abs(t.value))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/30 p-5 border-t border-border flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Total Geral da Fatura: {fmt(totalGeral)}
        </p>
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">
          Total a ser pago por mim
        </p>
        <p className="text-3xl font-black text-primary tracking-tighter">
          {fmt(totalMyPart)}
        </p>
      </div>
    </div>
  );
}

