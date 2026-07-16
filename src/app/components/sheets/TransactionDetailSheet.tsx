import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, SelectField, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import { CATEGORIES } from "../../store/seed";
import { iconFor } from "../shared/icons";
import { keywordFromDesc } from "../shared/categorize";
import { fmt, maskCurrency, parseCurrency } from "../shared/currency";
import type { Transaction } from "../../store/types";

export function TransactionDetailSheet({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useFinance();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("");
  const [card, setCard] = useState("");

  const [isSplit, setIsSplit] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [splitWith, setSplitWith] = useState("Esposa");

  useEffect(() => {
    if (tx) {
      setDesc(tx.desc);
      const displayVal = tx.isSplit && tx.originalValue ? Math.abs(tx.originalValue) : Math.abs(tx.value);
      setAmount(maskCurrency((displayVal * 100).toString()));
      setCat(tx.cat);
      setCard(tx.card || "Pix");
      setIsSplit(tx.isSplit || false);
      setSplitPercent(tx.splitPercent || 50);
      setSplitWith(tx.splitWith || "Esposa");
    }
  }, [tx, editing]);

  const close = () => {
    setEditing(false);
    setConfirmDelete(false);
    onClose();
  };

  if (!tx) return null;
  const Icon = iconFor(CATEGORIES.find((c) => c.name === tx.cat)?.iconName);

  const handleSave = () => {
    const num = parseCurrency(amount);
    if (!desc.trim()) {
      toast.error("Insira uma descrição válida.");
      return;
    }
    if (num <= 0) {
      toast.error("Insira um valor maior que zero.");
      return;
    }
    if (!cat) {
      toast.error("Selecione uma categoria.");
      return;
    }

    const bucket = CATEGORIES.find((c) => c.name === cat)?.bucket ?? tx.bucket;
    const finalValue = isSplit ? num * (splitPercent / 100) : num;
    const value = tx.type === "in" ? finalValue : -finalValue;
    const originalValue = tx.type === "in" ? num : -num;

    dispatch({
      type: "UPDATE_TX",
      tx: {
        ...tx,
        desc: desc.trim(),
        value,
        cat,
        bucket,
        card: tx.type === "out" ? card : "Pix",
        isSplit,
        splitPercent: isSplit ? splitPercent : undefined,
        splitWith: isSplit ? splitWith : undefined,
        originalValue: isSplit ? originalValue : undefined,
      },
    });

    if (cat !== tx.cat) {
      const keyword = keywordFromDesc(desc);
      if (keyword) {
        dispatch({ type: "ADD_RULE", rule: { keyword, cat, bucket } });
      }
    }

    toast.success("Transação atualizada!");
    setEditing(false);
  };

  const remove = () => {
    dispatch({ type: "DELETE_TX", id: tx.id });
    toast.success("Transação excluída");
    close();
  };

  return (
    <BottomSheet open={!!tx} onClose={close}>
      {editing ? (
        <div className="flex flex-col gap-3.5 mt-2">
          <h3 className="text-sm font-bold text-foreground">Editar Transação</h3>
          
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Descrição</label>
            <Field placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-muted-foreground">R$</span>
              <Field
                placeholder="0,00"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(maskCurrency(e.target.value))}
                className="text-sm font-mono font-bold pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Categoria</label>
            <SelectField value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.filter((c) => (tx.type === "in" ? c.name.includes("Renda") : !c.name.includes("Renda"))).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </SelectField>
          </div>

          {tx.type === "out" && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">Método de Pagamento</label>
              <SelectField value={card} onChange={(e) => setCard(e.target.value)}>
                {state.cards.map((c) => (
                  <option key={c.id} value={c.bank}>{c.name} ({c.bank})</option>
                ))}
                <option value="Pix">PIX / Saldo</option>
              </SelectField>
            </div>
          )}

          {tx.type === "out" && (
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

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <PrimaryButton className="flex-1 py-3.5" onClick={handleSave}>
              Salvar
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mt-2 mb-6">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{tx.desc}</h2>
            <p className={`text-base font-bold font-mono mt-1 ${tx.value === 0 ? "text-muted-foreground" : tx.type === "in" ? "text-green-500" : "text-red-500"}`}>
              {tx.type === "in" ? "+" : "-"}{fmt(tx.value)}
            </p>
          </div>

          <div className="bg-popover border border-border rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Categoria</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground bg-muted px-2 py-1 rounded-md">{tx.cat}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Data</span>
              <span className="text-xs font-semibold text-foreground">{tx.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pagamento</span>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" /> {tx.card}
              </span>
            </div>
            {tx.isSplit && (
              <>
                <div className="flex justify-between items-center border-t border-border/40 pt-4">
                  <span className="text-xs text-muted-foreground">Valor Total (Compra)</span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {fmt(Math.abs(tx.originalValue || tx.value))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Divisão com</span>
                  <span className="text-xs font-semibold text-foreground">
                    {tx.splitWith} ({100 - (tx.splitPercent || 50)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Sua Parte</span>
                  <span className="text-xs font-extrabold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {fmt(Math.abs(tx.value))} ({tx.splitPercent || 50}%)
                  </span>
                </div>
              </>
            )}
          </div>

          {confirmDelete ? (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-muted text-foreground font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={remove}
                className="flex-1 bg-destructive text-destructive-foreground font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                Confirmar exclusão
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 bg-destructive/10 hover:bg-destructive/15 text-destructive font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                Excluir
              </button>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
