import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, SelectField, PrimaryButton } from "../shared/ui";
import { maskCurrency, parseCurrency } from "../shared/currency";
import { todayISO, labelsFromISO } from "../shared/dates";
import { useFinance } from "../../store/finance-context";
import { CATEGORIES } from "../../store/seed";
import type { Transaction } from "../../store/types";

const NEW_CAT = "__new__";

export function AddTransactionSheet({
  open,
  onClose,
  defaultCard,
}: {
  open: boolean;
  onClose: () => void;
  defaultCard?: string;
}) {
  const { state, dispatch } = useFinance();
  const [tipo, setTipo] = useState<"out" | "in">("out");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [card, setCard] = useState(defaultCard ?? "Pix");
  const [date, setDate] = useState(todayISO());
  const [installments, setInstallments] = useState(1);
  const [isSplit, setIsSplit] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [splitWith, setSplitWith] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("finance-partner-name") || "Parceiro(a)" : "Parceiro(a)"));

  const reset = () => {
    setTipo("out");
    setDesc("");
    setAmount("");
    setCat("");
    setCustomCat("");
    setCard(defaultCard ?? "Pix");
    setDate(todayISO());
    setInstallments(1);
    setIsSplit(false);
    setSplitPercent(50);
    setSplitWith("Esposa");
  };

  const finalCat = cat === NEW_CAT ? customCat.trim() : cat;
  const valid = desc.trim() && parseCurrency(amount) > 0 && finalCat;

  const submit = () => {
    if (!valid) return;
    navigator.vibrate?.(50);
    const num = parseCurrency(amount);
    const finalValue = isSplit ? num * (splitPercent / 100) : num;
    const catInfo = CATEGORIES.find((c) => c.name === finalCat);
    const { month, date: dateLabel } = labelsFromISO(date);

    if (tipo === "out" && card !== "Pix" && installments > 1) {
      const txs: Transaction[] = [];
      const installmentValue = Number((finalValue / installments).toFixed(2));
      const originalInstallmentValue = Number((num / installments).toFixed(2));
      const MONTH_ABBR_LOWER = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const startMonthIdx = MONTH_ABBR_LOWER.indexOf(month);

      for (let i = 1; i <= installments; i++) {
        const monthIdx = (startMonthIdx !== -1 ? (startMonthIdx + i - 1) % 12 : 0);
        const targetMonth = MONTH_ABBR_LOWER[monthIdx];

        const dayPart = dateLabel.split(" ")[0] || "01";
        const targetDateLabel = `${dayPart} ${targetMonth}`;

        txs.push({
          id: `t${Date.now()}-${i}`,
          desc: `${desc.trim()} (${i}/${installments})`,
          cat: finalCat,
          month: targetMonth,
          date: targetDateLabel,
          value: -installmentValue,
          type: "out",
          bucket: catInfo?.bucket ?? "variavel",
          card,
          isSplit,
          splitPercent,
          splitWith,
          originalValue: -originalInstallmentValue,
        });
      }

      dispatch({ type: "ADD_TXS", txs });
      toast.success(`Compra parcelada em ${installments}x adicionada`);
    } else {
      const tx: Transaction = {
        id: `t${Date.now()}`,
        desc: desc.trim(),
        cat: finalCat,
        month,
        date: dateLabel,
        value: tipo === "in" ? finalValue : -finalValue,
        type: tipo,
        bucket: catInfo?.bucket ?? "variavel",
        card: tipo === "out" ? card : "Pix",
        isSplit,
        splitPercent,
        splitWith,
        originalValue: tipo === "in" ? num : -num,
      };
      dispatch({ type: "ADD_TX", tx });
      toast.success("Transação adicionada");
    }

    reset();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nova Transação">
      <div className="flex rounded-xl overflow-hidden bg-input-background p-1 mb-5">
        {(["out", "in"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tipo === t
                ? t === "in"
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t === "in" ? "Receita" : "Despesa"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Field placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />

        {/* Currency masked input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-muted-foreground">R$</span>
          <Field
            placeholder="0,00"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(maskCurrency(e.target.value))}
            className="text-lg font-mono font-bold pl-11"
          />
        </div>

        {/* Date picker */}
        <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-foreground" />

        <SelectField value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Categoria</option>
          {CATEGORIES.filter((c) => (tipo === "in" ? c.name.includes("Renda") : !c.name.includes("Renda"))).map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
          <option value={NEW_CAT}>+ Nova categoria</option>
        </SelectField>

        {cat === NEW_CAT && (
          <Field placeholder="Nome da nova categoria" value={customCat} onChange={(e) => setCustomCat(e.target.value)} autoFocus />
        )}

        {tipo === "out" && (
          <SelectField value={card} onChange={(e) => setCard(e.target.value)}>
            {state.cards.map((c) => (
              <option key={c.id} value={c.bank}>{c.name} ({c.bank})</option>
            ))}
            <option value="Pix">PIX / Saldo</option>
          </SelectField>
        )}

        {tipo === "out" && card !== "Pix" && (
          <SelectField value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
            <option value={1}>À vista (1x)</option>
            <option value={2}>2x sem juros</option>
            <option value={3}>3x sem juros</option>
            <option value={4}>4x sem juros</option>
            <option value={5}>5x sem juros</option>
            <option value={6}>6x sem juros</option>
            <option value={10}>10x sem juros</option>
            <option value={12}>12x sem juros</option>
          </SelectField>
        )}

        {tipo === "out" && (
          <div className="border border-border/60 bg-muted/10 rounded-2xl p-4.5 space-y-3.5 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Dividir esta compra?</span>
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSplit ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    isSplit ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {isSplit && (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Dividir com</label>
                    <Field
                      placeholder="Nome do parceiro"
                      value={splitWith}
                      onChange={(e) => setSplitWith(e.target.value)}
                      className="text-xs py-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Sua Parte (%)</label>
                    <Field
                      type="number"
                      placeholder="50"
                      min="1"
                      max="100"
                      value={splitPercent}
                      onChange={(e) => setSplitPercent(Math.min(100, Math.max(1, Number(e.target.value) || 50)))}
                      className="text-xs py-2.5 font-mono"
                    />
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor Total:</span>
                    <span className="font-mono font-bold text-foreground">R$ {parseCurrency(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary font-bold">
                    <span>Sua Parte ({splitPercent}%):</span>
                    <span className="font-mono">R$ {(parseCurrency(amount) * (splitPercent / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[10px]">
                    <span>Parte de {splitWith || "Parceiro"}:</span>
                    <span className="font-mono">R$ {(parseCurrency(amount) * ((100 - splitPercent) / 100)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PrimaryButton className="mt-5" disabled={!valid} onClick={submit}>
        Adicionar
      </PrimaryButton>
    </BottomSheet>
  );
}
