import { Plus, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useFinance } from "../../store/finance-context";
import { fmt } from "../shared/currency";
import { ProgressBar } from "../shared/ui";
import type { Goal } from "../../store/types";

export function MetasPage({
  onContribute,
  onAdd,
  onEdit,
}: {
  onContribute: (g: Goal) => void;
  onAdd: () => void;
  onEdit: (g: Goal) => void;
}) {
  const { state } = useFinance();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.97 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 25 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3.5 pb-2"
    >
      {state.goals.map((m) => {
        const pct = Math.round((m.atual / m.total) * 100);
        const done = m.atual >= m.total;
        return (
          <motion.div 
            key={m.id} 
            variants={itemVariants}
            whileHover={{ scale: 1.01, translateY: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {/* Background decorative glow based on goal color */}
            <div 
              className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-[0.04]"
              style={{ background: m.cor }}
            />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground truncate">{m.label}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(m);
                    }}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all cursor-pointer shrink-0"
                    title="Editar meta"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Prazo: {m.deadline}</p>
              </div>
              <span className="text-2xl font-black font-mono tracking-tight shrink-0" style={{ color: m.cor }}>{pct}%</span>
            </div>
            <div className="mb-3 relative z-10">
              <ProgressBar pct={pct} color={m.cor} track="bg-popover" height="h-2.5" />
            </div>
            <div className="flex justify-between text-xs relative z-10">
              <span className="text-muted-foreground">Acumulado: <span className="text-foreground font-semibold font-mono">{fmt(m.atual)}</span></span>
              <span className="text-muted-foreground">Meta: <span className="text-foreground font-semibold font-mono">{fmt(m.total)}</span></span>
            </div>
            {done ? (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mt-3 bg-green-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-center"
              >
                <p className="text-xs font-bold text-green-500 flex items-center justify-center gap-1">Meta concluída! 🎉</p>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => onContribute(m)}
                whileHover={{ scale: 1.01, filter: "brightness(1.05)" }}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full bg-primary/10 text-primary hover:bg-primary/15 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Aportar · faltam {fmt(m.total - m.atual)}
              </motion.button>
            )}
          </motion.div>
        );
      })}
      <motion.button
        variants={itemVariants}
        onClick={onAdd}
        whileHover={{ scale: 1.01, borderColor: "var(--primary)" }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-5 text-muted-foreground text-sm hover:text-primary transition-all duration-300"
      >
        <Plus size={16} />
        Nova meta
      </motion.button>
    </motion.div>
  );
}
