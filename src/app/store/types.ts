import type { LucideIcon } from "lucide-react";

export type TxType = "in" | "out";

// "Fixos" | "Variáveis" bucket used for the two-category split in charts.
export type Bucket = "fixo" | "variavel";

export interface Transaction {
  id: string;
  desc: string;
  cat: string;
  /** Month key this tx belongs to, e.g. "Jul". */
  month: string;
  /** Day label, e.g. "08 Jul". */
  date: string;
  value: number; // positive for income, negative for expense (for the user's part)
  type: TxType;
  bucket: Bucket;
  /** Bank identifier of the card used, or "Pix" for cash/pix. */
  card?: string;
  // Split transaction fields
  isSplit?: boolean;
  splitPercent?: number; // e.g., 50 for 50%
  splitWith?: string;    // name of the person
  originalValue?: number; // total amount of purchase before splitting
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  color: string;
  limit: number;
  current: number;
  closing: string;
  due: string;
  bestDay: string;
}

export interface Budget {
  id: string;
  cat: string;
  limite: number;
  iconName: string;
  cor: string;
}

export interface Goal {
  id: string;
  label: string;
  atual: number;
  total: number;
  cor: string;
  deadline: string;
}

export interface CategoryRule {
  keyword: string; // lowercase substring matched against the description
  cat: string;
  bucket: Bucket;
}

export interface CardBill {
  id: string;
  cardId: string; // references Card.id
  month: string; // e.g., "Jul"
  dueDate: string; // e.g., "10 Jul"
  totalValue: number;
  isPaid: boolean;
  fileName?: string;
}

export interface FinanceState {
  transactions: Transaction[];
  cards: Card[];
  budgets: Budget[];
  goals: Goal[];
  rules: CategoryRule[];
  hideBalances: boolean;
  currentMonth: string;
  faturas?: CardBill[];
}

export type FinanceAction =
  | { type: "ADD_TX"; tx: Transaction }
  | { type: "ADD_TXS"; txs: Transaction[] }
  | { type: "UPDATE_TX"; tx: Transaction }
  | { type: "DELETE_TX"; id: string }
  | { type: "ADD_GOAL"; goal: Goal }
  | { type: "UPDATE_GOAL"; goal: Goal }
  | { type: "DELETE_GOAL"; id: string }
  | { type: "CONTRIBUTE_GOAL"; id: string; amount: number }
  | { type: "UPDATE_BUDGET"; id: string; limite: number; cor?: string }
  | { type: "ADD_BUDGET"; budget: Budget }
  | { type: "DELETE_BUDGET"; id: string }
  | { type: "ADD_CARD"; card: Card }
  | { type: "UPDATE_CARD"; card: Card }
  | { type: "DELETE_CARD"; id: string }
  | { type: "ADD_RULE"; rule: CategoryRule }
  | { type: "TOGGLE_HIDE" }
  | { type: "SET_MONTH"; month: string }
  | { type: "CLEAR_ALL_DATA" }
  | { type: "ADD_BILL"; bill: CardBill }
  | { type: "UPDATE_BILL"; bill: CardBill }
  | { type: "DELETE_BILL"; id: string }
  | { type: "HYDRATE_STATE"; state: FinanceState };

export type IconName = string;
export type { LucideIcon };
