export interface ParsedExpense {
  descricao: string;
  valor_total: number;
  data: string;
  categoria: "Alimentação" | "Transporte" | "Moradia" | "Lazer" | "Saúde" | "Educação" | "Salário" | "Outros" | string;
  tipo?: "out" | "in";
  dividido: boolean;
  nome_parceiro: string | null;
  sua_parte: number;
  recorrente?: boolean;
  bucket?: "fixo" | "variavel";
  is_casa?: boolean;
}

export function cleanDateNoYear(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.split("-");
    return `${parts[2]}/${parts[1]}`;
  }

  // Remove any trailing or leading year /2026, /26, -2026, .2026
  let cleaned = dateStr
    .replace(/[\/\.-]\d{4}\b/g, "")
    .replace(/[\/\.-]\d{2}\b/g, "")
    .replace(/\b20\d{2}[\/\.-]?/g, "")
    .trim();

  return cleaned || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export async function parseNaturalLanguageExpenses(text: string, houseName?: string): Promise<ParsedExpense[]> {
  try {
    const res = await fetch("/api/parse-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, houseName }),
    });

    if (res.ok) {
      const data = await res.json();
      let rawList: ParsedExpense[] = [];
      if (Array.isArray(data) && data.length > 0) {
        rawList = data;
      } else if (data.expenses && Array.isArray(data.expenses)) {
        rawList = data.expenses;
      }

      if (rawList.length > 0) {
        return rawList.map((item) => {
          const isCasaExplicit = item.is_casa || item.dividido || item.categoria === "Moradia" || item.categoria === "Contas" || (houseName && item.descricao.toLowerCase().includes(houseName.toLowerCase()));
          return {
            ...item,
            data: cleanDateNoYear(item.data),
            is_casa: Boolean(isCasaExplicit),
          };
        });
      }
    }
  } catch (err) {
    console.warn("API de IA Gemini indisponível no momento. Executando motor local de regras:", err);
  }

  // Fallback Local Engine implementing the EXACT same business logic rules
  return parseExpensesLocally(text, houseName);
}

export function parseExpensesLocally(text: string, houseName?: string): ParsedExpense[] {
  const currentDateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const lines = text
    .split(/\n|;|\.|,| e /i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const results: ParsedExpense[] = [];

  const splitKeywords = ["dividi com", "metade com", "para mim e", "rachamos", "dividido com", "dividimos", "dividido"];

  for (const line of lines) {
    // Extract numbers like R$ 150,00 or 150.50 or 150
    const moneyMatch = line.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
    if (!moneyMatch) continue;

    const valor_total = parseFloat(moneyMatch[1].replace(",", "."));
    if (isNaN(valor_total) || valor_total <= 0) continue;

    // Remove amount string to clean description
    let cleanDesc = line.replace(moneyMatch[0], "").replace(/gastei|paguei|comprei|recebi/gi, "").trim();
    if (!cleanDesc) cleanDesc = "Despesa";

    // Date detection
    const dateMatch = line.match(/\b(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b/);
    const data = cleanDateNoYear(dateMatch ? dateMatch[1] : currentDateStr);

    // Categorization Rule
    let categoria: ParsedExpense["categoria"] = "Outros";
    const lowerLine = line.toLowerCase();
    if (/salário|salario|pagamento|recebi|pix recebido/i.test(lowerLine)) {
      categoria = "Salário";
    } else if (/almoço|almoco|jantar|lanche|restaurante|mercado|supermercado|ifood|padaria|comida/i.test(lowerLine)) {
      categoria = "Alimentação";
    } else if (/uber|99|combustível|combustivel|gasolina|estacionamento|metrô|metro|ônibus|onibus|uberx/i.test(lowerLine)) {
      categoria = "Transporte";
    } else if (/aluguel|condomínio|condominio|luz|água|agua|internet|energia|casa|moradia/i.test(lowerLine)) {
      categoria = "Moradia";
    } else if (/cinema|show|festa|bar|jogo|steam|viagem|lazer/i.test(lowerLine)) {
      categoria = "Lazer";
    } else if (/médico|medico|farmácia|farmacia|remédio|remedio|exame|hospital|saúde|saude/i.test(lowerLine)) {
      categoria = "Saúde";
    } else if (/curso|escola|faculdade|livro|aula|educação|educacao/i.test(lowerLine)) {
      categoria = "Educação";
    }

    // Split detection Rule
    let dividido = false;
    let nome_parceiro: string | null = null;
    let sua_parte = valor_total;

    for (const kw of splitKeywords) {
      if (lowerLine.includes(kw)) {
        dividido = true;
        // Try to extract partner name
        const matchPartner = line.match(/(?:dividi com|metade com|para mim e|rachamos com|com o|com a)\s+([A-Za-zÀ-ú]+)/i);
        if (matchPartner && matchPartner[1] && !/que|o|a|um|uma/.test(matchPartner[1].toLowerCase())) {
          nome_parceiro = matchPartner[1].charAt(0).toUpperCase() + matchPartner[1].slice(1);
        } else {
          nome_parceiro = "Não especificado";
        }
        sua_parte = Math.round((valor_total / 2) * 100) / 100;
        break;
      }
    }

    // House expense rule (is_casa)
    const isHouseNameMatch = Boolean(houseName && lowerLine.includes(houseName.toLowerCase()));
    const isCasaKeyword = /casa|moradia|aluguel|condomínio|condominio|luz|água|agua|internet|gás|gas|feira|supermercado/i.test(lowerLine);
    const is_casa = dividido || categoria === "Moradia" || isCasaKeyword || isHouseNameMatch;

    // Fixed / Recurring expense detection Rule
    const recurringKeywords = [
      "financiamento", "aluguel", "condomínio", "condominio", "mensalidade",
      "plano", "assinatura", "fixo", "gasto fixo", "recorrente", "todo mês", "todo mes", "mensal"
    ];
    const isRecurringMatch = recurringKeywords.some((kw) => lowerLine.includes(kw)) || categoria === "Moradia";
    const recorrente = isRecurringMatch;
    const bucket: "fixo" | "variavel" = isRecurringMatch ? "fixo" : "variavel";

    results.push({
      descricao: cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1),
      valor_total,
      data,
      categoria,
      tipo: categoria === "Salário" ? "in" : "out",
      dividido,
      nome_parceiro,
      sua_parte,
      recorrente,
      bucket,
      is_casa,
    });
  }

  if (results.length === 0 && text.trim().length > 0) {
    // Single fallback item if no numbers matched line by line
    results.push({
      descricao: text.slice(0, 30),
      valor_total: 0,
      data: currentDateStr,
      categoria: "Outros",
      dividido: false,
      nome_parceiro: null,
      sua_parte: 0,
      is_casa: false,
    });
  }

  return results;
}
