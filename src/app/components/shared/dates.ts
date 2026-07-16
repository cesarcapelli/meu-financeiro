// Portuguese 3-letter month abbreviations, matching the app's timeline labels.
export const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Today as an <input type="date"> value (YYYY-MM-DD).
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Derives { month, date } labels from an ISO date string.
export function labelsFromISO(iso: string): { month: string; date: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const month = MONTH_ABBR[(m || 1) - 1] ?? "Jan";
  return { month, date: `${String(d || 1).padStart(2, "0")} ${month}` };
}

// Best-effort parse of a CSV date cell (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd) → labels.
export function labelsFromLoose(raw: string): { month: string; date: string } | null {
  const s = raw.trim();
  let d: number, m: number;
  let match = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (match) {
    d = Number(match[1]);
    m = Number(match[2]);
  } else {
    match = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (match) {
      m = Number(match[2]);
      d = Number(match[3]);
    } else {
      return null;
    }
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const month = MONTH_ABBR[m - 1];
  return { month, date: `${String(d).padStart(2, "0")} ${month}` };
}
