import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { BottomSheet } from "../shared/BottomSheet";
import { Field, PrimaryButton } from "../shared/ui";
import { useFinance } from "../../store/finance-context";
import type { Card } from "../../store/types";

const COLORS = [
  "linear-gradient(135deg, #7c3aed, #db2777)", // Violeta e Rosa (padrão antigo)
  "linear-gradient(135deg, #4f46e5, #06b6d4)", // Indigo e Cyan
  "linear-gradient(135deg, #2563eb, #3b82f6)", // Azul
  "linear-gradient(135deg, #ea580c, #e11d48)", // Laranja e Vermelho
  "linear-gradient(135deg, #16a34a, #10b981)", // Verde e Esmeralda
  "linear-gradient(135deg, #111827, #3b82f6)", // Dark e Azul
];

export function AddCardSheet({
  open,
  onClose,
  cardToEdit,
}: {
  open: boolean;
  onClose: () => void;
  cardToEdit?: Card | null;
}) {
  const { dispatch } = useFinance();
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [closing, setClosing] = useState("");
  const [due, setDue] = useState("");
  const [bestDay, setBestDay] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmDelete(false);
      if (cardToEdit) {
        setName(cardToEdit.name);
        setBank(cardToEdit.bank);
        setLimit(cardToEdit.limit.toString());
        setColor(cardToEdit.color || COLORS[0]);
        setClosing(cardToEdit.closing !== "—" ? cardToEdit.closing : "05");
        setDue(cardToEdit.due !== "—" ? cardToEdit.due : "12");
        setBestDay(cardToEdit.bestDay !== "—" ? cardToEdit.bestDay : "28");
      } else {
        setName("");
        setBank("");
        setLimit("");
        setColor(COLORS[0]);
        setClosing("05");
        setDue("12");
        setBestDay("28");
      }
    }
  }, [open, cardToEdit]);

  const valid = name.trim() && bank.trim() && Number(limit) > 0;

  const submit = () => {
    if (!valid) return;
    navigator.vibrate?.(50);

    const cardData: Card = {
      id: cardToEdit ? cardToEdit.id : `c${Date.now()}`,
      name: name.trim(),
      bank: bank.trim(),
      color,
      limit: Number(limit),
      current: cardToEdit ? cardToEdit.current : 0,
      closing: closing.trim() || "05",
      due: due.trim() || "12",
      bestDay: bestDay.trim() || "28",
    };

    if (cardToEdit) {
      dispatch({
        type: "UPDATE_CARD",
        card: cardData,
      });
      toast.success("Cartão atualizado com sucesso!");
    } else {
      dispatch({
        type: "ADD_CARD",
        card: cardData,
      });
      toast.success("Cartão adicionado com sucesso!");
    }
    onClose();
  };

  const handleDelete = () => {
    if (!cardToEdit) return;
    dispatch({ type: "DELETE_CARD", id: cardToEdit.id });
    toast.success("Cartão excluído com sucesso!");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={cardToEdit ? "Editar Cartão" : "Novo Cartão"}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Nome do Cartão</label>
          <Field placeholder="ex: Cartão Gold" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Banco / Emissor</label>
          <Field placeholder="ex: Nubank, Itaú" value={bank} onChange={(e) => setBank(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Limite total (R$)</label>
          <Field placeholder="Limite total (R$)" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} className="font-mono" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Fechamento</label>
            <Field placeholder="Dia" type="number" min="1" max="31" value={closing} onChange={(e) => setClosing(e.target.value)} className="text-center font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Vencimento</label>
            <Field placeholder="Dia" type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)} className="text-center font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Melhor Dia</label>
            <Field placeholder="Dia" type="number" min="1" max="31" value={bestDay} onChange={(e) => setBestDay(e.target.value)} className="text-center font-mono" />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-1 py-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Tema de Cores</span>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg border border-border/40 transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" : "hover:scale-105"}`}
                style={{ background: c }}
                aria-label="Selecionar cor"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <PrimaryButton disabled={!valid} onClick={submit}>
          {cardToEdit ? "Salvar alterações" : "Adicionar cartão"}
        </PrimaryButton>

        {cardToEdit && (
          <div className="mt-2 border-t border-border/40 pt-3">
            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 px-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Confirmar Exclusão
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-rose-500/20 text-red-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Excluir Cartão
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
