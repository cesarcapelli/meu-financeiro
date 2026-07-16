import { CATEGORIES } from "../../store/seed";
import type { Bucket, CategoryRule } from "../../store/types";

// Built-in keyword → category fallbacks. First match wins.
const RULES: { re: RegExp; cat: string }[] = [
  { re: /ifood|rappi|restaurant|mercado|super|padaria|lanche|bar\b/i, cat: "Alimentação" },
  { re: /uber|99|combust|posto|gasolina|estacion|metro|onibus|ônibus/i, cat: "Transporte" },
  { re: /netflix|spotify|prime|disney|hbo|assinatura|apple\.com|google/i, cat: "Assinaturas" },
  { re: /aluguel|condom|luz|energia|água|agua|internet|vivo|claro|tim/i, cat: "Moradia" },
  { re: /cinema|show|game|steam|viagem|hotel|lazer/i, cat: "Lazer" },
  { re: /salário|salario|pagamento|freelance|pix recebido|rendiment/i, cat: "Renda" },
];

// Extracts a stable keyword from a description to key learned rules on.
export function keywordFromDesc(desc: string): string {
  const cleaned = desc
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-zà-ú\s]/gi, " ")
    .trim();
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 3);
  return tokens[0] ?? cleaned.slice(0, 12).trim();
}

// User rules take priority, then built-in rules, then a default bucket.
export function guessCategory(desc: string, rules: CategoryRule[] = []): { cat: string; bucket: Bucket } {
  const lower = desc.toLowerCase();
  const learned = rules.find((r) => lower.includes(r.keyword));
  if (learned) return { cat: learned.cat, bucket: learned.bucket };

  for (const r of RULES) {
    if (r.re.test(desc)) {
      const info = CATEGORIES.find((c) => c.name === r.cat);
      return { cat: r.cat, bucket: info?.bucket ?? "variavel" };
    }
  }
  return { cat: "Lazer", bucket: "variavel" };
}
