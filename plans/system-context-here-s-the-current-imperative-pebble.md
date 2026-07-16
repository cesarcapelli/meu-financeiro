# Plano — Evolução do Finance App (features + layout + polish)

## Context

O app hoje é uma bela casca estática: `src/app/App.tsx` (795 linhas) concentra 5 telas
(Dashboard, Transações, Cartões, Orçamento, Metas), com todos os dados em constantes de
módulo. O FAB "Nova Transação", os botões "Editar/Excluir", "Nova meta", "Ver todas" e os
filtros de mês **não fazem nada** — nenhuma ação altera estado. Toda a UI é custom em Tailwind
usando (bem) os tokens CSS do design system (`--primary`, `--card`, `--chart-*`, fontes Plus
Jakarta Sans / DM Mono).

Objetivo desta rodada (escolha do usuário: **pacote completo**): transformar o protótipo em um
app funcional e coeso, sem quebrar a identidade visual. Três frentes:
1. **Arquitetura** — um store global para que ações realmente mutem dados e reflitam em todas as telas.
2. **Features de valor** — adicionar/editar/excluir transações, contribuir em metas, editar orçamentos, insights.
3. **Polish** — microinterações, toasts, empty states, componentização e consistência de bottom sheets.

Restrição de design: manter o padrão atual (UI mobile custom baseada nos **tokens CSS**), pois o
`@figma/astraui-kit` é orientado a desktop B2C (exige `SidebarNavigation`) e não se aplica ao mobile.
Reaproveitamos apenas primitivos neutros já instalados (`sonner` para toast, `canvas-confetti`,
`motion/react`). Nenhuma cor/fonte hardcoded — só variáveis do `theme.css`.

## Arquitetura proposta

Criar uma camada de estado e quebrar o `App.tsx` monolítico em arquivos menores.

### 1. Store global — `src/app/store/finance-context.tsx`
- `FinanceProvider` + hook `useFinance()` via `React.createContext` + `useReducer`.
- Estado: `transactions`, `cards`, `budgets`, `goals`, `hideBalances`, `currentMonth`.
- Actions: `addTransaction`, `updateTransaction`, `deleteTransaction`, `addGoal`, `contributeGoal`,
  `updateBudget`, `addBudget`, `addCard`, `toggleHideBalances`, `setMonth`.
- Seed inicial = dados hoje em `App.tsx` (linhas 40–82), movidos para `src/app/store/seed.ts`.
- Selectors derivados (memoizados) em `src/app/store/selectors.ts`: `getMonthSummary` (receitas/
  despesas/saldo), `getSpendingByCategory` (Fixos vs Variáveis), `getCashflowSeries`,
  `getCardInvoice`. Elimina os números hardcoded (ex.: `receitas=13600` na linha 181).

### 2. Componentização (`src/app/components/`)
Extrair de `App.tsx`, um arquivo por peça:
- `shared/`: `currency.ts` (o helper `fmt`), `BottomSheet.tsx` (sheet reutilizável com handle,
  backdrop blur, `slide-in-from-bottom`, fechar por backdrop/Esc — hoje duplicado no AddModal e no
  detalhe de transação), `ProgressBar.tsx`, `SectionCard.tsx`, `EmptyState.tsx`, `ChartTooltip.tsx`, `TxRow.tsx`.
- `pages/`: `DashboardPage.tsx`, `TransacoesPage.tsx`, `CartoesPage.tsx`, `OrcamentoPage.tsx`, `MetasPage.tsx`.
- `sheets/`: `AddTransactionSheet.tsx`, `TransactionDetailSheet.tsx`, `AddGoalSheet.tsx`,
  `ContributeGoalSheet.tsx`, `EditBudgetSheet.tsx`, `AddCardSheet.tsx`.
- `App.tsx` fica só com o shell (status bar, header, main, FAB, bottom nav) + `<FinanceProvider>`.

## Features novas / que passam a funcionar

### Transações (fluxo central)
- **Add**: `AddTransactionSheet` valida (descrição + valor > 0 + categoria) e dispara `addTransaction`;
  mapeia categoria→ícone; `toast.success("Transação adicionada")`.
- **Editar / Excluir**: `TransactionDetailSheet` passa a chamar `updateTransaction` / `deleteTransaction`
  (com confirmação inline). Hoje os botões nas linhas 508–513 são inertes.
- **Filtros** na `TransacoesPage`: chips "Todas / Receitas / Despesas" + busca existente; agrupar por
  data com cabeçalhos; `EmptyState` quando vazio.

### Dashboard
- Saudação por horário ("Bom dia/tarde/noite, Ana") no header.
- **Card de Insight** novo: compara despesas do mês vs mês anterior (via selectors) — ex.: "Você gastou
  12% menos que em Junho", com seta/cor semântica.
- Linha de **quick actions** (Adicionar, Transferir, Metas) abaixo do saldo.
- Todos os números passam a vir dos selectors (reativos ao add/delete).

### Metas
- **Nova meta** funcional (`AddGoalSheet`): nome, valor alvo, prazo, cor.
- **Contribuir** (`ContributeGoalSheet`): aporta valor → `contributeGoal`; ao atingir 100% dispara
  `canvas-confetti` + toast de parabéns.

### Orçamento
- Card geral reativo (soma limites vs gasto real do mês).
- **Editar limite** por categoria (`EditBudgetSheet`) e **adicionar categoria** de orçamento.
- Alerta visual mantido quando excede (reusar lógica das linhas 596–600).

### Cartões
- **Adicionar cartão** (`AddCardSheet`) alimentando o carrossel.
- Filtro de mês passa a filtrar transações de fato pelo mês selecionado (via selector `getCardInvoice`).

## Polish / microinterações
- **Toasts** com `sonner`: montar `<Toaster />` (tema dark, tokens) no shell.
- **BottomSheet** unificado: animação de entrada/saída consistente, fechar no `Escape`, trava de scroll do body.
- **Bottom nav**: indicador de aba ativa com "pill" animada (`motion/react` `layoutId`), respeitando `--primary`.
- **Transições de página**: `AnimatePresence` leve ao trocar de aba (fade/slide curto).
- **Empty states** ilustrados (ícone + texto) em listas vazias.
- **Safe-area / toque**: alvos ≥44px, `active:scale` consistente, `scrollbar-hide` mantido.
- Acessibilidade básica: `aria-label` em botões só-ícone, `role="dialog"` nos sheets, foco inicial.

## Arquivos-chave
- Novo: `src/app/store/finance-context.tsx`, `store/seed.ts`, `store/selectors.ts`, `store/types.ts`.
- Novo: componentes em `src/app/components/{shared,pages,sheets}/`.
- Modificar: `src/app/App.tsx` (reduzir a shell + provider).
- Sem alterações em `src/styles/*` (usar tokens existentes). Confirmar `sonner`, `canvas-confetti`,
  `motion` já em `package.json` (estão) — nenhuma instalação nova esperada.

## Verificação (end-to-end)
O dev server já roda (não iniciar manualmente). Validar no preview:
1. Adicionar transação (receita e despesa) → aparece em Recentes/Transações e altera Saldo, Fluxo de Caixa e Gastos por Categoria.
2. Editar e excluir transação → listas e totais atualizam; toast aparece.
3. Filtros de Transações (Todas/Receitas/Despesas) + busca → resultados corretos e empty state.
4. Contribuir em meta até 100% → barra atualiza e dispara confetti + toast.
5. Criar nova meta e novo cartão → aparecem nas respectivas telas.
6. Editar limite de orçamento → card geral e da categoria recalculam (alerta ao exceder).
7. Ocultar saldos (olho) → mascara valores em todas as telas via estado global.
8. Navegação: pill animada, transições suaves, alvos de toque confortáveis.
9. Conferir que nenhum valor de cor/fonte está hardcoded (só variáveis CSS) e sem warnings de key duplicada no console.
