import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import type { Goal } from "../../store/types";

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

export function EditGoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { dispatch } = useFinance();
  const [label, setLabel] = useState("");
  const [atual, setAtual] = useState("");
  const [total, setTotal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [cor, setCor] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (goal) {
      setLabel(goal.label);
      setAtual(String(goal.atual));
      setTotal(String(goal.total));
      setDeadline(goal.deadline);
      setCor(goal.cor || COLORS[0]);
      setConfirmDelete(false);
    }
  }, [goal]);

  if (!goal) return null;

  const valid = label.trim() && Number(total) > 0 && Number(atual) >= 0;

  const submit = () => {
    if (!valid) return;
    dispatch({
      type: "UPDATE_GOAL",
      goal: {
        id: goal.id,
        label: label.trim(),
        atual: Number(atual),
        total: Number(total),
        cor,
        deadline: deadline.trim() || "Sem prazo",
      },
    });
    toast.success("Meta atualizada");
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.warning("Clique novamente em Excluir para confirmar");
      return;
    }
    dispatch({ type: "DELETE_GOAL", id: goal.id });
    toast.success("Meta excluída");
    onClose();
  };

  return (
    <BottomSheet open={!!goal} onClose={onClose} title={`Editar Meta: ${goal.label}`}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
            Nome da meta
          </label>
          <Field placeholder="Nome da meta" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
              Valor atual (R$)
            </label>
            <Field
              placeholder="Já poupado"
              type="number"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              className="font-mono font-semibold"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
              Valor alvo (R$)
            </label>
            <Field
              placeholder="Alvo total"
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="font-mono font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
            Prazo (ex: Dez 2026)
          </label>
          <Field placeholder="Prazo da meta" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 px-1 py-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cor</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  cor === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "opacity-80"
                }`}
                style={{ background: c }}
                aria-label="Selecionar cor"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 mt-5">
        <button
          onClick={handleDelete}
          className={`flex items-center justify-center gap-1.5 border px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
            confirmDelete
              ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
              : "border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10"
          }`}
          title={confirmDelete ? "Clique para confirmar" : "Excluir esta meta"}
        >
          <Trash2 size={14} />
          <span>{confirmDelete ? "Confirmar?" : "Excluir"}</span>
        </button>
        <PrimaryButton className="flex-1 py-3" disabled={!valid} onClick={submit}>
          Salvar Alterações
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}
