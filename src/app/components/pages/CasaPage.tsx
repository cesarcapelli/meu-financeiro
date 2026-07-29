import React, { useEffect, useState } from "react";
import { Settings, Plus, Receipt, Coins, Trash2, Calendar, UserCheck, Tag, Home, X } from "lucide-react";
import { useFinance } from "../../store/finance-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../store/firebase";
import { money } from "../shared/currency";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { CATEGORIES } from "../../store/seed";

interface CasaPageProps {
  onOpenSettings: () => void;
}

export function CasaPage({ onOpenSettings }: CasaPageProps) {
  const { state, dispatch, user } = useFinance();
  const hidden = state.hideBalances;
  const [homeData, setHomeData] = useState<{ name: string; photoURL: string } | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Quick Add form state
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");
  const [cat, setCat] = useState("Moradia");
  const [isSplit, setIsSplit] = useState(true);
  const [partnerName, setPartnerName] = useState("");

  // Dynamic partner name from localStorage or transactions
  const foundInTxs = state.transactions.find(
    (t) => t.isSplit && t.splitWith && t.splitWith.trim() && !["Parceiro", "Parceiro(a)", "Membro da Casa"].includes(t.splitWith)
  )?.splitWith;
  const storedPartner = (typeof window !== "undefined" ? localStorage.getItem("finance-partner-name") : "") || foundInTxs || "";
  const displayPartnerName = partnerName.trim() || storedPartner || "Parceiro(a)";

  useEffect(() => {
    if (storedPartner && !partnerName) {
      setPartnerName(storedPartner);
    }
  }, [storedPartner]);

  useEffect(() => {
    if (user?.homeId) {
      getDoc(doc(db, "homes", user.homeId)).then((d) => {
        if (d.exists()) {
          const data = d.data() as any;
          setHomeData(data);
          if (data.name) {
            try { localStorage.setItem("finance-house-name", data.name); } catch {}
          }
        }
      });
    } else {
      const cachedName = typeof window !== "undefined" ? localStorage.getItem("finance-house-name") : null;
      if (cachedName) {
        setHomeData({ name: cachedName, photoURL: "" });
      } else {
        setHomeData(null);
      }
    }
  }, [user?.homeId]);

  // House transactions for current month
  const houseTransactions = state.transactions.filter((t) => {
    if (t.month !== state.currentMonth) return false;
    const isCasaNameMatch = homeData?.name && t.desc?.toLowerCase().includes(homeData.name.toLowerCase());
    return Boolean(
      t.isHouse ||
      t.isSplit ||
      t.cat === "Moradia" ||
      t.cat === "Contas" ||
      isCasaNameMatch
    );
  });

  // Helper to resolve full value of an item consistently
  const getItemFullVal = (t: { value: number; originalValue?: number; isSplit?: boolean }) => {
    if (t.originalValue && t.originalValue > 0) {
      return t.originalValue;
    }
    if (t.isSplit) {
      return Math.abs(t.value) * 2;
    }
    return Math.abs(t.value);
  };

  // Calculate totals
  let totalCasa = 0;
  let partnerOwesYou = 0;
  let youPaidTotal = 0;

  houseTransactions.forEach((t) => {
    const fullVal = getItemFullVal(t);
    const myPart = Math.abs(t.value);

    totalCasa += fullVal;
    youPaidTotal += fullVal;

    if (t.isSplit) {
      const partnerPart = Math.max(0, fullVal - myPart);
      partnerOwesYou += partnerPart;
    }
  });

  const handleAddCasaTx = (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value.replace(",", "."));
    if (!desc.trim() || isNaN(valNum) || valNum <= 0) {
      toast.error("Informe a descrição e um valor válido!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const myPartVal = isSplit ? Math.round((valNum / 2) * 100) / 100 : valNum;

    dispatch({
      type: "ADD_TX",
      tx: {
        id: `tx-casa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        desc: desc.trim(),
        value: -Math.abs(myPartVal),
        date: todayStr,
        month: state.currentMonth,
        type: "out",
        cat: cat || "Moradia",
        bucket: "fixo",
        card: "Pix",
        isSplit,
        splitPercent: isSplit ? 50 : undefined,
        splitWith: isSplit ? partnerName || "Parceiro(a)" : undefined,
        originalValue: valNum,
        isRecurring: true,
        isHouse: true,
      },
    });

    toast.success("Despesa adicionada na Casa!");
    setDesc("");
    setValue("");
    setIsSplit(true);
    setPartnerName("");
    setAddSheetOpen(false);
  };

  const handleDeleteTx = (id: string, description: string) => {
    dispatch({ type: "DELETE_TX", id });
    toast.success(`'${description}' removido da Casa.`);
  };

  const handleSettleUp = () => {
    if (houseTransactions.length === 0) {
      toast.info("Nenhuma despesa para acertar contas no momento.");
      return;
    }
    toast.success("Contas marcadas como acertadas! Tudo quitado.");
  };

  const houseTitle = homeData?.name || (user?.homeId ? "Nossa Casa" : "Minha Casa");

  return (
    <div className="flex flex-col gap-4 pt-2 pb-32 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 overflow-hidden flex items-center justify-center shadow-inner text-teal-500 shrink-0">
            {homeData?.photoURL ? (
              <img src={homeData.photoURL} alt="Casa" className="w-full h-full object-cover" />
            ) : (
              <Home size={22} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {houseTitle}
            </h2>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {user?.homeId ? "Gestão Compartilhada" : "Toque na engrenagem para configurar"}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gastos da Casa no Mês</p>
          <div className="px-2 py-0.5 bg-teal-500/10 text-teal-500 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
            <Home size={11} /> {houseTransactions.length} item(s)
          </div>
        </div>

        <p className="text-3xl font-black text-foreground tracking-tight font-mono">
          {money(totalCasa, hidden)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
          {partnerOwesYou > 0
            ? `${displayPartnerName} deve ${money(partnerOwesYou, hidden)} a você das contas divididas.`
            : "Todas as despesas compartilhadas estão equilibradas."}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Você Pagou Total</p>
            <p className="text-sm font-bold text-foreground font-mono">{money(youPaidTotal, hidden)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">A Receber de {displayPartnerName}</p>
            <p className="text-sm font-bold text-teal-500 font-mono">{money(partnerOwesYou, hidden)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setAddSheetOpen(true)}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center mb-1">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold text-foreground">Novo Gasto da Casa</span>
        </button>

        <button
          onClick={handleSettleUp}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
            <Coins size={20} />
          </div>
          <span className="text-xs font-bold text-foreground">Acertar Contas</span>
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between ml-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Despesas da Casa ({houseTransactions.length})
          </h3>
        </div>

        {houseTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Receipt size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Nenhuma despesa de casa este mês</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
              Gastos com "Moradia", "Contas", mensagens contendo "casa", "dividi com" ou lançados por IA aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {houseTransactions.map((tx) => {
              const fullVal = getItemFullVal(tx);
              const myVal = Math.abs(tx.value);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-muted/20 transition-all flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                      <Home size={18} />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground text-sm truncate">{tx.desc}</span>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={11} /> {tx.date}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary">
                          {tx.cat}
                        </span>
                        {tx.isSplit && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 flex items-center gap-1">
                            <UserCheck size={10} /> Dividido (sua parte: {money(myVal, hidden)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-black text-foreground text-sm sm:text-base">
                        {money(fullVal, hidden)}
                      </p>
                      {tx.isSplit && (
                        <p className="text-[10px] text-muted-foreground font-medium">Valor Total</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTx(tx.id, tx.desc)}
                      className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir despesa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Bottom Sheet for Casa */}
      <BottomSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="Lançar Gasto da Casa">
        <form onSubmit={handleAddCasaTx} className="flex flex-col gap-4 pt-1 pb-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Descrição do Gasto
            </label>
            <input
              type="text"
              placeholder="Ex: Mercado da semana, Conta de Luz, Aluguel"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Categoria
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-teal-500 cursor-pointer"
              >
                {CATEGORIES.filter((c) => !c.name.includes("Renda")).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Checkbox */}
          <div className="p-3 rounded-xl border border-border bg-muted/30 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
              />
              Dividir valor igualmente (50% para cada)
            </label>

            {isSplit && (
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  placeholder="Nome do(a) parceiro(a) (opcional)"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-input-background text-foreground outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md active:scale-[0.98] mt-2"
          >
            Salvar Gasto da Casa
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
