import type { Transaction } from "../../store/types";
import { iconFor } from "./icons";
import { CATEGORIES } from "../../store/seed";
import { fmt } from "./currency";
import { useFinance } from "../../store/finance-context";

// Resolves an icon from the transaction's category.
function txIconName(cat: string) {
  return CATEGORIES.find((c) => c.name === cat)?.iconName ?? "Wallet";
}

export function TxRow({
  t,
  hidden,
  onClick,
  subtitle,
}: {
  t: Transaction;
  hidden?: boolean;
  onClick?: () => void;
  subtitle?: string;
}) {
  const { state } = useFinance();
  const b = state.budgets.find((x) => x.cat === t.cat);
  const Icon = iconFor(txIconName(t.cat));

  const bgStyle = b ? { background: `${b.cor}18` } : undefined;
  const iconStyle = b ? { color: b.cor } : undefined;

  return (
    <div
      className={`flex items-center gap-3 py-3.5 ${onClick ? "active:scale-[0.98] active:bg-muted transition-all cursor-pointer rounded-xl -mx-2 px-2" : ""}`}
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!b ? (t.type === "in" ? "bg-primary/10" : "bg-muted") : ""}`}
        style={bgStyle}
      >
        <Icon
          size={15}
          className={!b ? (t.type === "in" ? "text-primary" : "text-muted-foreground") : ""}
          style={iconStyle}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground break-words leading-tight">{t.desc}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>{subtitle ?? `${t.cat} · ${t.date}`}</span>
          {t.card && t.card !== "Pix" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-foreground bg-muted rounded-full shrink-0">
              💳 Cartão {t.card}
            </span>
          )}
          {t.isSplit && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded-full shrink-0">
              👥 Dividido ({t.splitPercent}%)
            </span>
          )}
        </p>
      </div>
      <p className={`text-sm font-mono font-bold shrink-0 ${t.value === 0 ? "text-muted-foreground" : t.type === "in" ? "text-green-500" : "text-red-500"}`}>
        {t.type === "in" ? "+" : "-"}{hidden ? "••••" : fmt(t.value)}
      </p>
    </div>
  );
}
