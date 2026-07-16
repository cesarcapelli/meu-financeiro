import { fmt } from "./currency";

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2.5 text-xs font-mono shadow-xl">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name === "receitas" ? "Rec" : "Desp"}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}
