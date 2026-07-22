import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Upload, FileText, Copy, Download } from "lucide-react";
import { BottomSheet } from "../shared/BottomSheet";
import { SelectField, PrimaryButton, EmptyState } from "../shared/ui";
import { parseLoose, fmt } from "../shared/currency";
import { labelsFromLoose } from "../shared/dates";
import { guessCategory } from "../shared/categorize";
import { isOfx, parseOfx, type RawTx } from "../shared/ofx";
import { useFinance } from "../../store/finance-context";
import type { Transaction } from "../../store/types";

// Minimal CSV parser with quoted-field support and delimiter detection.
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); if (row.some((c) => c.trim())) rows.push(row); }
  return rows;
}

function guessCol(headers: string[], keys: string[]): number {
  const idx = headers.findIndex((h) => keys.some((k) => h.toLowerCase().includes(k)));
  return idx;
}

// Stable signature for duplicate detection across imports.
const sig = (desc: string, value: number, date: string) =>
  `${desc.trim().toLowerCase()}|${value}|${date}`;

export function ImportCsvSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [ofxTx, setOfxTx] = useState<RawTx[] | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [colDate, setColDate] = useState(0);
  const [colDesc, setColDesc] = useState(1);
  const [colVal, setColVal] = useState(2);
  const [includeDupes, setIncludeDupes] = useState(false);

  const loaded = rows.length > 0 || ofxTx !== null;

  const reset = () => {
    setRows([]);
    setOfxTx(null);
    setHasHeader(true);
    setIncludeDupes(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const loadText = (name: string, text: string) => {
    if (isOfx(name, text)) {
      const parsed = parseOfx(text);
      if (parsed.length === 0) {
        toast.error("Nenhum lançamento encontrado no OFX");
        return;
      }
      setOfxTx(parsed);
      return;
    }
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      toast.error("Arquivo vazio ou inválido");
      return;
    }
    setRows(parsed);
    const headers = parsed[0];
    setColDate(Math.max(guessCol(headers, ["data", "date"]), 0));
    setColDesc(Math.max(guessCol(headers, ["desc", "hist", "lançamento", "lancamento", "memo"]), 1));
    setColVal(Math.max(guessCol(headers, ["valor", "value", "amount", "montante"]), 2));
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => loadText(f.name, String(reader.result ?? ""));
    reader.readAsText(f);
  };

  const headers = rows[0] ?? [];
  const colCount = headers.length;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  // Normalize either source into a common raw shape.
  const rawList = useMemo<RawTx[]>(() => {
    if (ofxTx) return ofxTx;
    return dataRows
      .map((r) => {
        const desc = (r[colDesc] ?? "").trim();
        const value = parseLoose(r[colVal] ?? "");
        const labels = labelsFromLoose(r[colDate] ?? "") ?? { month: state.currentMonth, date: `01 ${state.currentMonth}` };
        if (!desc || value === 0) return null;
        return { desc, value, month: labels.month, date: labels.date } as RawTx;
      })
      .filter((t): t is RawTx => t !== null);
  }, [ofxTx, dataRows, colDate, colDesc, colVal, state.currentMonth]);

  // Existing signatures to detect duplicates against current data.
  const existing = useMemo(
    () => new Set(state.transactions.map((t) => sig(t.desc, t.value, t.date))),
    [state.transactions]
  );

  // Build transactions, flagging duplicates.
  const built = useMemo(() => {
    const seen = new Set<string>();
    return rawList.map((r, i) => {
      const s = sig(r.desc, r.value, r.date);
      const dupe = existing.has(s) || seen.has(s);
      seen.add(s);
      const type = r.value >= 0 ? "in" : "out";
      const { cat, bucket } =
        type === "in" ? { cat: "Renda", bucket: "fixo" as const } : guessCategory(r.desc, state.rules);
      const tx: Transaction = {
        id: `imp${Date.now()}-${i}`,
        desc: r.desc,
        cat,
        month: r.month,
        date: r.date,
        value: r.value,
        type,
        bucket,
        card: "Pix",
      };
      return { tx, dupe };
    });
  }, [rawList, existing, state.rules]);

  const dupeCount = built.filter((b) => b.dupe).length;
  const toImport = built.filter((b) => includeDupes || !b.dupe).map((b) => b.tx);

  const confirm = () => {
    if (toImport.length === 0) return;
    dispatch({ type: "ADD_TXS", txs: toImport });
    toast.success(`${toImport.length} transações importadas`);
    reset();
    onClose();
  };

  const colOptions = Array.from({ length: colCount }, (_, i) => i);
  const colLabel = (i: number) => (hasHeader && headers[i] ? headers[i] : `Coluna ${i + 1}`);

  return (
    <BottomSheet open={open} onClose={onClose} title="Importar extrato (CSV ou OFX)">
      {!loaded ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.ofx,text/csv,text/plain,application/x-ofx"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl py-10 text-muted-foreground active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload size={20} className="text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Selecionar arquivo</span>
            <span className="text-xs">Extrato em CSV ou OFX do seu banco</span>
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
            O arquivo é processado no seu navegador — nada é enviado para servidores.
          </p>

          <div className="mt-5 p-3.5 bg-muted/40 border border-border/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Modelo Excel / Planilha</span>
              <div className="flex items-center gap-2">
                <a
                  href="/modelo_importacao.csv"
                  download="modelo_importacao.csv"
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={11} /> Baixar Modelo
                </a>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button
                  onClick={() => {
                    const modelText = "Data;Descrição;Valor;Categoria\n10/07/2026;Salário;7500;Renda\n12/07/2026;Aluguel;-2100;Moradia\n15/07/2026;Mercado;-620;Alimentação";
                    navigator.clipboard.writeText(modelText);
                    toast.success("Modelo copiado! Cole no Excel ou Bloco de Notas.");
                  }}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={11} /> Copiar CSV
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Crie uma planilha com as colunas <strong className="text-foreground">Data</strong>, <strong className="text-foreground">Descrição</strong>, <strong className="text-foreground">Valor</strong> (com sinal de menos para despesas, ex: -487,00) e <strong className="text-foreground">Categoria</strong>. Depois, salve no Excel como <strong className="text-foreground">CSV (separado por ponto e vírgula)</strong> e faça o upload!
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Column mapping — CSV only */}
          {!ofxTx && (
            <div className="flex flex-col gap-3 mb-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="accent-[var(--primary)]" />
                A primeira linha é cabeçalho
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Data", val: colDate, set: setColDate },
                  { label: "Descrição", val: colDesc, set: setColDesc },
                  { label: "Valor", val: colVal, set: setColVal },
                ].map((c) => (
                  <div key={c.label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                    <SelectField className="py-2 text-xs" value={c.val} onChange={(e) => c.set(Number(e.target.value))}>
                      {colOptions.map((i) => (
                        <option key={i} value={i}>{colLabel(i)}</option>
                      ))}
                    </SelectField>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ofxTx && (
            <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
              <FileText size={12} /> Arquivo OFX reconhecido automaticamente
            </p>
          )}

          {/* Duplicate notice */}
          {dupeCount > 0 && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground bg-popover border border-border rounded-xl px-3 py-2.5 mb-4">
              <input
                type="checkbox"
                checked={includeDupes}
                onChange={(e) => setIncludeDupes(e.target.checked)}
                className="accent-[var(--primary)] mt-0.5"
              />
              <span>
                <span className="text-foreground font-semibold flex items-center gap-1">
                  <Copy size={12} /> {dupeCount} possíveis duplicatas
                </span>
                Já existem lançamentos idênticos. Marque para importar mesmo assim.
              </span>
            </label>
          )}

          {/* Preview */}
          <p className="text-xs font-semibold text-foreground mb-2">
            Prévia · {toImport.length} de {built.length} serão importadas
          </p>
          {built.length === 0 ? (
            <EmptyState icon={FileText} text="Nenhuma linha válida com esse mapeamento" />
          ) : (
            <div className="bg-popover border border-border rounded-2xl divide-y divide-border max-h-56 overflow-y-auto scrollbar-hide mb-5">
              {built.slice(0, 30).map(({ tx, dupe }) => (
                <div key={tx.id} className={`flex items-center justify-between px-3 py-2.5 ${dupe && !includeDupes ? "opacity-40" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                      {tx.desc}
                      {dupe && <Copy size={11} className="text-muted-foreground shrink-0" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{tx.cat} · {tx.date}</p>
                  </div>
                  <span className={`text-xs font-mono font-bold shrink-0 ml-2 ${tx.type === "in" ? "text-primary" : "text-foreground"}`}>
                    {tx.type === "in" ? "+" : "-"}{fmt(tx.value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-muted text-foreground font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Trocar arquivo
            </button>
            <PrimaryButton className="flex-1" disabled={toImport.length === 0} onClick={confirm}>
              Importar {toImport.length > 0 ? `(${toImport.length})` : ""}
            </PrimaryButton>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
