import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, SelectField, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import { CATEGORIES } from "../../store/seed";
import { maskCurrency, parseCurrency } from "../shared/currency";

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

export function AddBudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useFinance();
  const [cat, setCat] = useState("");
  const [limite, setLimite] = useState("");
  const [cor, setCor] = useState(COLORS[0]);

  const used = state.budgets.map((b) => b.cat);
  const options = CATEGORIES.filter((c) => !c.name.includes("Renda") && !used.includes(c.name));
  const valid = cat && parseCurrency(limite) > 0;

  const submit = () => {
    if (!valid) return;
    navigator.vibrate?.(50);
    const iconName = CATEGORIES.find((c) => c.name === cat)?.iconName ?? "Wallet";
    dispatch({
      type: "ADD_BUDGET",
      budget: { id: `b${Date.now()}`, cat, limite: parseCurrency(limite), iconName, cor },
    });
    toast.success("Orçamento criado");
    setCat("");
    setLimite("");
    setCor(COLORS[0]);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Novo Orçamento">
      <div className="flex flex-col gap-3">
        <SelectField value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Categoria</option>
          {options.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </SelectField>
        <Field
          placeholder="Limite mensal (R$)"
          type="text"
          inputMode="numeric"
          value={limite}
          onChange={(e) => setLimite(maskCurrency(e.target.value))}
          className="font-mono"
        />
        <div className="flex items-center gap-3 px-1 py-2">
          <span className="text-xs text-muted-foreground">Cor</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${cor === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : ""}`}
                style={{ background: c }}
                aria-label="Selecionar cor"
              />
            ))}
          </div>
        </div>
      </div>
      <PrimaryButton className="mt-5" disabled={!valid} onClick={submit}>
        Criar orçamento
      </PrimaryButton>
    </BottomSheet>
  );
}
