import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Check, Trash2, UserCheck, Calendar, Tag, AlertCircle, RefreshCw, Repeat, Home } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { parseNaturalLanguageExpenses, cleanDateNoYear, type ParsedExpense } from "../shared/aiParser";
import { useFinance } from "../../store/finance-context";
import { money } from "../shared/currency";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../store/firebase";

interface AiInputSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AiInputSheet({ open, onClose }: AiInputSheetProps) {
  const { state, dispatch, user } = useFinance();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedExpense[]>([]);
  const [rawJson, setRawJson] = useState<string>("");
  const [houseName, setHouseName] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Load saved house name from localStorage or Firestore
      const cached = typeof window !== "undefined" ? localStorage.getItem("finance-house-name") : null;
      if (cached) {
        setHouseName(cached);
      } else if (user?.homeId) {
        getDoc(doc(db, "homes", user.homeId)).then((d) => {
          if (d.exists() && d.data().name) {
            setHouseName(d.data().name);
            try { localStorage.setItem("finance-house-name", d.data().name); } catch {}
          }
        });
      }
    }
  }, [open, user?.homeId]);

  const handleProcess = async () => {
    if (!text.trim()) {
      toast.error("Digite ou cole uma mensagem com seus gastos!");
      return;
    }

    setLoading(true);
    try {
      const items = await parseNaturalLanguageExpenses(text, houseName);
      setParsedItems(items);
      setRawJson(JSON.stringify(items, null, 2));
      toast.success(`${items.length} gasto(s) identificados!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao analisar o texto livre.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = () => {
    if (parsedItems.length === 0) return;

    let count = 0;
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      const isIncome = item.tipo === "in" || item.categoria === "Salário";
      const amount = item.dividido ? item.sua_parte : item.valor_total;
      const finalVal = isIncome ? Math.abs(amount) : -Math.abs(amount);

      const isFixed = item.recorrente || item.bucket === "fixo" || item.categoria === "Moradia" || item.categoria === "Contas";

      // Explicit rule: Every expense that is 'dividido' OR 'is_casa' OR category Moradia/Contas OR contains house name must go to Casa tab!
      const isCasa = item.is_casa || item.dividido || item.categoria === "Moradia" || item.categoria === "Contas" || (houseName && item.descricao.toLowerCase().includes(houseName.toLowerCase()));

      dispatch({
        type: "ADD_TX",
        tx: {
          id: `tx-ai-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          desc: item.descricao,
          value: finalVal,
          date: cleanDateNoYear(item.data),
          month: state.currentMonth,
          type: isIncome ? "in" : "out",
          cat: item.categoria || "Outros",
          bucket: isFixed ? "fixo" : "variavel",
          card: "Pix",
          isSplit: item.dividido,
          splitPercent: item.dividido ? 50 : undefined,
          splitWith: item.nome_parceiro || undefined,
          originalValue: item.valor_total,
          isRecurring: isFixed,
          isHouse: isCasa,
        },
      });
      count++;
    }

    toast.success(`${count} transação(ões) lançada(s) com sucesso!`);
    setParsedItems([]);
    setText("");
    setRawJson("");
    onClose();
  };

  const removeItem = (index: number) => {
    const updated = parsedItems.filter((_, i) => i !== index);
    setParsedItems(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Lançamento Inteligente por IA">
      <div className="flex flex-col gap-4">
        {/* Helper Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-primary/10 to-emerald-500/10 border border-primary/20 flex items-start gap-3">
          <Sparkles className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <p className="font-bold text-foreground">Digite ou cole seus gastos em texto livre</p>
            <p className="text-muted-foreground leading-relaxed">
              Exemplo: <span className="text-foreground/90 font-medium">"Gastei 150 no mercado, 80 no Uber e dividi o jantar de 120 com o Lucas"</span>
            </p>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Sua mensagem ou áudio transcrito:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole ou escreva aqui seus gastos..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleProcess}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Analisando texto com IA...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Extrair Dados e Processar
            </>
          )}
        </button>

        {/* Parsed Items Preview */}
        {parsedItems.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dados Extraídos ({parsedItems.length})
              </h4>
              <button
                onClick={() => setParsedItems([])}
                className="text-xs font-medium text-destructive hover:underline"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <span>{item.descricao}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-md font-semibold">
                        {item.categoria}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.data}
                      </span>

                      {(item.recorrente || item.bucket === "fixo") && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Repeat size={12} /> Fixo / Recorrente
                        </span>
                      )}

                      {(item.is_casa || item.dividido || item.categoria === "Moradia" || item.categoria === "Contas" || (houseName && item.descricao.toLowerCase().includes(houseName.toLowerCase()))) && (
                        <span className="flex items-center gap-1 text-teal-500 font-semibold bg-teal-500/10 px-1.5 py-0.5 rounded">
                          <Home size={12} /> Tela Casa
                        </span>
                      )}

                      {item.dividido && (
                        <span className="flex items-center gap-1 text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          <UserCheck size={12} /> Dividido ({money(item.sua_parte)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-foreground">
                        {money(item.valor_total)}
                      </p>
                      {item.dividido && (
                        <p className="text-[10px] text-muted-foreground">Total da conta</p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remover este item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Raw JSON Debug Viewer */}
            <div className="mt-2 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                JSON Purificado Gerado:
              </span>
              <pre className="p-2.5 bg-card/80 border border-border rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[100px]">
                {rawJson}
              </pre>
            </div>

            {/* Final Add Button */}
            <button
              onClick={handleSaveAll}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check size={16} /> Confirmar Lançamento ({parsedItems.length})
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
