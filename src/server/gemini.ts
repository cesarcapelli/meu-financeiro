import { GoogleGenAI, Type } from "@google/genai";

export async function parseExpensesWithGemini(text: string, houseName?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const currentDateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const registeredHouseName = houseName && houseName.trim() ? houseName.trim() : "Casa";

  const systemInstruction = `Você é o motor de inteligência artificial de um aplicativo de gestão financeira inteligente.
O usuário enviará mensagens em texto livre que podem conter um ou múltiplos gastos de uma só vez.
Sua tarefa é analisar o texto, extrair os dados financeiros, processar as regras de negócio e retornar SEMPRE um JSON purificado, sem formatação Markdown adicional (sem \`\`\`json).

Data de referência do sistema: ${currentDateStr} (apenas dia e mês).
Nome da Casa Registrada na Aba Casa: "${registeredHouseName}"

Regras de Negócio Obrigatórias:
1. Extraia a descrição clara do gasto, o valor total (como número flutuante positivo) e a data no formato "DD/MM" (apenas dia e mês, ex: "15/07", JAMAIS inclua o ano). Se nenhuma data for mencionada, assuma a data atual do sistema em dia e mês (${currentDateStr}).
2. Categorize cada transação automaticamente em uma das seguintes categorias padrão: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Salário", "Outros"].
3. Detecte se a conta foi dividida. Procure por termos como "dividi com", "metade com", "para mim e fulano", "rachamos", "dividido".
   - Se for dividido: defina 'dividido' como true, salve o 'nome_parceiro' se mencionado (caso contrário coloque "Não especificado") e calcule 'sua_parte' dividindo o valor por 2 (ou pela quantidade de pessoas mencionadas).
   - Se NÃO for dividido: defina 'dividido' como false, 'nome_parceiro' como null, e 'sua_parte' idêntica ao 'valor_total'.
4. Detecte se o gasto é FIXO ou RECORRENTE (mensal, financiamento, aluguel, condomínio, assinatura, plano, "todo mês", "fixo").
   - Se for fixo/recorrente: defina 'recorrente' como true e 'bucket' como "fixo".
   - Se for gasto pontual/esporádico: defina 'recorrente' como false e 'bucket' como "variavel".
5. Regra da Tela CASA ('is_casa'):
   - Defina 'is_casa': true se o gasto for para a casa (categoria 'Moradia', 'Contas', supermercado, feira da casa, aluguel, condomínio, luz, água, internet, gás, móveis, reforma, ou se o texto contiver a palavra 'casa' ou mencionar o nome da casa "${registeredHouseName}").
   - REGRA OBRIGATÓRIA DE DIVISÃO: Se 'dividido' for true (o usuário disse 'dividido', 'dividi com', 'rachamos', etc.), defina OBRIGATORIAMENTE 'is_casa': true também, pois todos os gastos divididos devem obrigatoriamente ir para a tela Casa.
   - Caso contrário (gasto estritamente pessoal e não dividido), defina 'is_casa': false.
6. O resultado final deve ser um array JSON de objetos contendo exatamente as chaves: 'descricao', 'valor_total', 'data', 'categoria', 'tipo', 'dividido', 'nome_parceiro', 'sua_parte', 'recorrente', 'bucket', 'is_casa'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: text,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        description: "Lista de gastos/receitas extraídos do texto",
        items: {
          type: Type.OBJECT,
          properties: {
            descricao: { type: Type.STRING },
            valor_total: { type: Type.NUMBER },
            data: { type: Type.STRING },
            categoria: { type: Type.STRING },
            tipo: { type: Type.STRING, description: "'out' para despesa ou 'in' para salário/renda" },
            dividido: { type: Type.BOOLEAN },
            nome_parceiro: { type: Type.STRING },
            sua_parte: { type: Type.NUMBER },
            recorrente: { type: Type.BOOLEAN, description: "true para gastos fixos, mensais, financiamento, aluguel, assinaturas" },
            bucket: { type: Type.STRING, description: "'fixo' ou 'variavel'" },
            is_casa: { type: Type.BOOLEAN, description: "true se o gasto for para a casa ou se for um gasto dividido" },
          },
          required: ["descricao", "valor_total", "data", "categoria", "dividido", "sua_parte", "recorrente", "bucket", "is_casa"],
        },
      },
    },
  });

  return response.text;
}
