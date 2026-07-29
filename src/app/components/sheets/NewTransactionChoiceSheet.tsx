import { Sparkles, Edit3, X, Zap } from "lucide-react";
import { BottomSheet } from "../shared/BottomSheet";

interface NewTransactionChoiceSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectAi: () => void;
  onSelectManual: () => void;
}

export function NewTransactionChoiceSheet({
  open,
  onClose,
  onSelectAi,
  onSelectManual,
}: NewTransactionChoiceSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 pt-1 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex flex-col">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">Nova Transação</h2>
            <p className="text-xs text-muted-foreground">Como você deseja registrar este lançamento?</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* AI Option */}
          <button
            onClick={() => {
              onClose();
              onSelectAi();
            }}
            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-500/25 hover:border-purple-500/50 transition-all text-left active:scale-[0.98] cursor-pointer shadow-sm overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform border border-white/20">
              <Sparkles size={22} className="text-white animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-foreground">Lançar com IA</span>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                  <Zap size={10} className="fill-current" /> Rápido
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Digite ou cole em texto livre. A IA identifica valor, categoria e fixa na hora!
              </p>
            </div>
          </button>

          {/* Manual Option */}
          <button
            onClick={() => {
              onClose();
              onSelectManual();
            }}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-muted-foreground/30 hover:bg-muted/30 transition-all text-left active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-primary/20">
              <Edit3 size={22} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-extrabold text-sm text-foreground">Preencher Manualmente</span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Formulário tradicional com seleção individual de valor, data, cartão e categoria.
              </p>
            </div>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
