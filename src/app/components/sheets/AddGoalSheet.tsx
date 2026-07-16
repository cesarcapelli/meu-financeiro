import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

export function AddGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useFinance();
  const [label, setLabel] = useState("");
  const [total, setTotal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [cor, setCor] = useState(COLORS[0]);

  const valid = label.trim() && Number(total) > 0;

  const submit = () => {
    if (!valid) return;
    navigator.vibrate?.(50);
    dispatch({
      type: "ADD_GOAL",
      goal: {
        id: `g${Date.now()}`,
        label: label.trim(),
        atual: 0,
        total: Number(total),
        cor,
        deadline: deadline.trim() || "Sem prazo",
      },
    });
    toast.success("Meta criada");
    setLabel("");
    setTotal("");
    setDeadline("");
    setCor(COLORS[0]);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nova Meta">
      <div className="flex flex-col gap-3">
        <Field placeholder="Nome da meta" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Field placeholder="Valor alvo (R$)" type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="font-mono" />
        <Field placeholder="Prazo (ex: Dez 2026)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
        Criar meta
      </PrimaryButton>
    </BottomSheet>
  );
}
