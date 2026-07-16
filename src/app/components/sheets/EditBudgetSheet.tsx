import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import type { Budget } from "../../store/types";
import { maskCurrency, parseCurrency } from "../shared/currency";

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

export function EditBudgetSheet({ budget, onClose }: { budget: Budget | null; onClose: () => void }) {
  const { dispatch } = useFinance();
  const [limite, setLimite] = useState("");
  const [cor, setCor] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (budget) {
      setLimite(maskCurrency(String(Math.round(budget.limite * 100))));
      setCor(budget.cor || COLORS[0]);
      setConfirmDelete(false);
    }
  }, [budget]);

  if (!budget) return null;
  const valid = parseCurrency(limite) > 0;

  const submit = () => {
    if (!valid) return;
    dispatch({ type: "UPDATE_BUDGET", id: budget.id, limite: parseCurrency(limite), cor });
    toast.success("Orçamento atualizado");
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.warning("Clique novamente em Excluir para confirmar");
      return;
    }
    dispatch({ type: "DELETE_BUDGET", id: budget.id });
    toast.success("Orçamento excluído");
    onClose();
  };

  return (
    <BottomSheet open={!!budget} onClose={onClose} title={`Editar Orçamento: ${budget.cat}`}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5 block">
            Limite Mensal
          </label>
          <Field
            placeholder="Novo limite (R$)"
            type="text"
            inputMode="numeric"
            value={limite}
            onChange={(e) => setLimite(maskCurrency(e.target.value))}
            className="text-lg font-mono font-bold"
          />
        </div>

        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-xs text-muted-foreground font-semibold">Cor do Orçamento</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  cor === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-115" : ""
                }`}
                style={{ background: c }}
                aria-label="Selecionar cor"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center gap-1.5 border px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
              confirmDelete
                ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                : "border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10"
            }`}
            title={confirmDelete ? "Clique para confirmar" : "Excluir este orçamento"}
          >
            <Trash2 size={14} />
            <span>{confirmDelete ? "Confirmar?" : "Excluir"}</span>
          </button>
          <PrimaryButton className="flex-1 py-3" disabled={!valid} onClick={submit}>
            Salvar Alterações
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}
