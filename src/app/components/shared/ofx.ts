import { parseLoose } from "./currency";
import { MONTH_ABBR } from "./dates";

export interface RawTx {
  desc: string;
  value: number;
  month: string;
  date: string; // "05 Jul"
}

// Extracts the value of an (often unclosed) OFX/SGML tag.
function tag(block: string, name: string): string {
  const re = new RegExp(`<${name}>([^<\\r\\n]*)`, "i");
  return block.match(re)?.[1]?.trim() ?? "";
}

// Parses an OFX date (YYYYMMDD[HHMMSS][.xxx][tz]) → month/date labels.
function ofxDate(raw: string): { month: string; date: string } | null {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const month = MONTH_ABBR[Number(m[2]) - 1];
  if (!month) return null;
  return { month, date: `${m[3]} ${month}` };
}

export function isOfx(name: string, content: string): boolean {
  return /\.ofx$/i.test(name) || /OFXHEADER|<OFX>|<STMTTRN>/i.test(content);
}

export function parseOfx(content: string): RawTx[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  const out: RawTx[] = [];
  for (const b of blocks) {
    const value = parseLoose(tag(b, "TRNAMT"));
    const desc = tag(b, "NAME") || tag(b, "MEMO") || "Lançamento";
    const d = ofxDate(tag(b, "DTPOSTED"));
    if (!value || !d) continue;
    out.push({ desc, value, month: d.month, date: d.date });
  }
  return out;
}
