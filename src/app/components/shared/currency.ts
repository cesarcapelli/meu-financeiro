export const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(v));

// Masks a formatted value when balances are hidden.
export const money = (v: number, hidden: boolean, dots = "••••••") => (hidden ? dots : fmt(v));

// ─── Currency input mask ───────────────────────────────────────────────
// Keeps only digits and formats as BRL as the user types.
export function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const value = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// Numeric value (in reais) from a masked/typed string.
export function parseCurrency(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

// Parses a loose number string from a CSV cell (handles "1.234,56", "-89.90", "R$ 12,00").
export function parseLoose(raw: string): number {
  let s = raw.trim().replace(/[R$\s]/g, "");
  if (!s) return 0;
  const neg = /^-/.test(s) || /\)$/.test(s);
  s = s.replace(/[()]/g, "").replace(/^-/, "");
  if (s.includes(",") && s.includes(".")) {
    // Brazilian format: "." thousands, "," decimals.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  if (Number.isNaN(n)) return 0;
  return neg ? -Math.abs(n) : n;
}
