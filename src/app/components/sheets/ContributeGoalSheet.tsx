import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import { fmt } from "../shared/currency";
import type { Goal } from "../../store/types";

export function ContributeGoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { dispatch } = useFinance();
  const [amount, setAmount] = useState("");

  const close = () => {
    setAmount("");
    onClose();
  };

  if (!goal) return null;
  const restante = goal.total - goal.atual;
  const num = Number(amount);
  const valid = num > 0;

  const submit = () => {
    if (!valid) return;
    navigator.vibrate?.(50);
    dispatch({ type: "CONTRIBUTE_GOAL", id: goal.id, amount: num });
    if (goal.atual + num >= goal.total) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
      toast.success(`Meta "${goal.label}" concluída! 🎉`);
    } else {
      toast.success("Aporte registrado");
    }
    close();
  };

  return (
    <BottomSheet open={!!goal} onClose={close} title={`Aportar em ${goal.label}`}>
      <div className="bg-popover border border-border rounded-2xl p-4 mb-4 flex justify-between">
        <span className="text-xs text-muted-foreground">Faltam</span>
        <span className="text-sm font-bold font-mono" style={{ color: goal.cor }}>{fmt(restante)}</span>
      </div>
      <Field
        placeholder="Valor do aporte (R$)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="text-lg font-mono font-bold"
      />
      <div className="flex gap-2 mt-3">
        {[100, 500, restante].map((v, i) => (
          <button
            key={i}
            onClick={() => setAmount(String(Math.round(v)))}
            className="flex-1 bg-muted text-foreground text-xs font-semibold py-2 rounded-lg active:scale-[0.98] transition-transform"
          >
            {i === 2 ? "Tudo" : fmt(v)}
          </button>
        ))}
      </div>
      <PrimaryButton className="mt-5" disabled={!valid} onClick={submit}>
        Confirmar aporte
      </PrimaryButton>
    </BottomSheet>
  );
}
