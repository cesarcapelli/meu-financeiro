import React, { useState } from "react";
import { Plus, CreditCard, Import, ArrowRightLeft, Upload } from "lucide-react";
import { useFinance } from "../../store/finance-context";
import { txForMonth } from "../../store/selectors";
import { fmt, maskCurrency, parseCurrency } from "../shared/currency";
import type { Transaction, Card } from "../../store/types";
import { motion, AnimatePresence } from "motion/react";

interface CarteiraPageProps {
  search: string;
  onOpenTx: (tx: Transaction) => void;
  onImport: () => void;
  onAddCard: () => void;
  onEditCard: (c: Card) => void;
}

export function CarteiraPage({ search, onOpenTx, onImport, onAddCard, onEditCard }: CarteiraPageProps) {
  const [activeTab, setActiveTab] = useState<"conta" | "cartoes">("conta");
  const { state } = useFinance();
  const txs = txForMonth(state, state.currentMonth);

  // Filter for 'Conta Corrente'
  // Show entries that are NOT on credit cards (Pix, None, etc)
  // Wait, historically, does 'transacoes' show all? Usually Conta Corrente means non-credit card.
  // Actually, the user says: "Aba "Conta Corrente": Exibe o histórico de transações tradicional de saldo (entradas, saídas, PIX, transferências)."
  const contaCorrenteTxs = txs.filter(t => !t.card || t.card === "Pix" || t.card === "");
  const searchLower = search.toLowerCase();
  const filteredConta = contaCorrenteTxs.filter(t => t.desc.toLowerCase().includes(searchLower) || (t.cat && t.cat.toLowerCase().includes(searchLower)));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-20">
      <div className="bg-muted p-1 rounded-2xl flex mx-4 mt-2">
        <button
          onClick={() => setActiveTab("conta")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "conta"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Conta Corrente
        </button>
        <button
          onClick={() => setActiveTab("cartoes")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "cartoes"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Cartões de Crédito
        </button>
      </div>

      <div className="px-4">
        {activeTab === "conta" ? (
          <ContaCorrenteTab txs={filteredConta} onOpenTx={onOpenTx} onImport={onImport} />
        ) : (
          <CartoesTab cards={state.cards} allTxs={txs} onAddCard={onAddCard} onEditCard={onEditCard} onOpenTx={onOpenTx} />
        )}
      </div>
    </div>
  );
}

function ContaCorrenteTab({ txs, onOpenTx, onImport }: { txs: Transaction[], onOpenTx: (t: Transaction) => void, onImport: () => void }) {
  if (txs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ArrowRightLeft size={32} className="text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Nenhuma transação</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Suas entradas e saídas aparecerão aqui.
          </p>
        </div>
        <button onClick={onImport} className="mt-2 flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform">
          <Upload size={14} /> Importar OFX
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {txs.map((t) => (
        <TransactionRow key={t.id} t={t} onClick={() => onOpenTx(t)} />
      ))}
    </div>
  );
}

function TransactionRow({ t, onClick }: { t: Transaction, onClick: () => void }) {
  const isPos = t.value > 0;
  
  // Logic for shared expenses
  const isShared = t.isSplit;
  const originalValue = t.originalValue || Math.abs(t.value);
  const myValue = Math.abs(t.value);

  return (
    <div onClick={onClick} className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors shadow-sm">
      <div className="w-10 shrink-0 text-center">
        <span className="text-[10px] font-bold text-muted-foreground tracking-wide block leading-none">{t.date.split(" ")[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate block">{t.desc}</span>
        <span className="text-[10px] text-muted-foreground truncate block">{t.cat} {t.card ? `• ${t.card}` : ""}</span>
      </div>
      <div className="flex flex-col items-end shrink-0">
        {isShared ? (
          <>
            <span className="text-[10px] font-medium text-muted-foreground ">{fmt(originalValue)}</span>
            <span className={`text-sm font-black ${isPos ? "text-green-500" : "text-primary"}`}>{isPos ? "+" : ""}{fmt(myValue)}</span>
          </>
        ) : (
          <span className={`text-sm font-bold ${isPos ? "text-green-500" : t.value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {isPos ? "+" : ""}{fmt(Math.abs(t.value))}
          </span>
        )}
      </div>
    </div>
  );
}

function CartoesTab({ cards, allTxs, onAddCard, onEditCard, onOpenTx }: { cards: Card[], allTxs: Transaction[], onAddCard: () => void, onEditCard: (c: Card) => void, onOpenTx: (t: Transaction) => void }) {
  const [expandedCard, setExpandedCard] = useState<string | null>(cards.length > 0 ? cards[0].id : null);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard size={32} className="text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Nenhum cartão</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Adicione seus cartões de crédito para acompanhar faturas.
          </p>
        </div>
        <button onClick={onAddCard} className="mt-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform">
          Adicionar Cartão
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meus Cartões</h3>
        <button onClick={onAddCard} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
          <Plus size={12} /> Novo
        </button>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {cards.map((c) => {
          const isActive = expandedCard === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setExpandedCard(c.id)}
              className={`snap-center shrink-0 w-[260px] h-[150px] p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all border ${
                isActive ? "bg-card shadow-md border-primary scale-100" : "bg-card/50 border-border opacity-70 scale-95"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-black text-foreground">{c.bank}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded-md">{c.due}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Limite Disponível</p>
                <p className="text-lg font-black text-foreground">{fmt(c.limit - c.current)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {expandedCard && (
          <motion.div
            key={expandedCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1 mt-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detalhes da Fatura</h3>
            </div>
            
            <FaturaDetails cardId={expandedCard} cards={cards} allTxs={allTxs} onOpenTx={onOpenTx} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaturaDetails({ cardId, cards, allTxs, onOpenTx }: { cardId: string, cards: Card[], allTxs: Transaction[], onOpenTx: (t: Transaction) => void }) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return null;

  const cardTxs = allTxs.filter(t => t.card === card.bank);
  
  const totalGeral = cardTxs.reduce((sum, t) => sum + (t.originalValue || Math.abs(t.value)), 0);
  const totalMyPart = cardTxs.reduce((sum, t) => sum + Math.abs(t.value), 0);

  if (cardTxs.length === 0) {
    return (
      <div className="bg-card border border-border p-6 rounded-2xl text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Fatura zerada neste mês.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="px-4 py-2 divide-y divide-border/50">
        {cardTxs.map(t => (
          <div key={t.id} onClick={() => onOpenTx(t)} className="py-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 shrink-0 text-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-wide block leading-none">{t.date.split(" ")[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate block">{t.desc}</span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {t.isSplit ? (
                <>
                  <span className="text-[10px] font-medium text-muted-foreground ">{fmt(t.originalValue || Math.abs(t.value))}</span>
                  <span className="text-sm font-black text-primary">{fmt(Math.abs(t.value))}</span>
                </>
              ) : (
                <span className={`text-sm font-bold ${t.value < 0 ? "text-destructive" : "text-muted-foreground"}`}>{fmt(Math.abs(t.value))}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-muted/30 p-5 border-t border-border flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Total Geral da Fatura: {fmt(totalGeral)}
        </p>
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">Total a ser pago por mim</p>
        <p className="text-3xl font-black text-primary tracking-tighter">{fmt(totalMyPart)}</p>
      </div>
    </div>
  );
}
