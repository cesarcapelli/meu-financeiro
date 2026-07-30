import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react";
import type { FinanceState, FinanceAction } from "./types";
import { initialState } from "./seed";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { toast } from "sonner";
import type { AuthUser } from "../components/pages/LoginPage";

function getStorageKey(uid?: string) {
  return uid ? `finance-app-state-${uid}` : "finance-app-state-v1";
}

// Hydrate from localStorage, falling back to clean seed data.
function loadState(uid?: string): FinanceState {
  if (typeof window === "undefined") return { faturas: [], ...initialState };
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return { faturas: [], ...initialState };
    const parsed = JSON.parse(raw);
    return { faturas: [], ...initialState, ...parsed };
  } catch {
    return { faturas: [], ...initialState };
  }
}

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "ADD_TX":
      return { ...state, transactions: [action.tx, ...state.transactions] };
    case "ADD_TXS":
      return { ...state, transactions: [...action.txs, ...state.transactions] };
    case "UPDATE_TX":
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)),
      };
    case "DELETE_TX":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.goal] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goal.id ? action.goal : g)),
      };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.id),
      };
    case "CONTRIBUTE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, atual: Math.min(g.atual + action.amount, g.total) } : g
        ),
      };
    case "UPDATE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.id ? { ...b, limite: action.limite, ...(action.cor ? { cor: action.cor } : {}) } : b
        ),
      };
    case "ADD_BUDGET":
      return { ...state, budgets: [...state.budgets, action.budget] };
    case "DELETE_BUDGET":
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };
    case "ADD_CARD":
      return { ...state, cards: [...state.cards, action.card] };
    case "UPDATE_CARD":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.card.id ? action.card : c)),
      };
    case "DELETE_CARD":
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.id),
      };
    case "ADD_RULE": {
      // Replace an existing rule for the same keyword, else prepend.
      const rest = state.rules.filter((r) => r.keyword !== action.rule.keyword);
      return { ...state, rules: [action.rule, ...rest] };
    }
    case "TOGGLE_HIDE":
      return { ...state, hideBalances: !state.hideBalances };
    case "SET_MONTH":
      return { ...state, currentMonth: action.month };
    case "CLEAR_ALL_DATA":
      return {
        ...state,
        transactions: [],
        faturas: [],
        cards: [],
        goals: [],
        budgets: [],
        rules: [],
      };
    case "ADD_BILL":
      return { ...state, faturas: [action.bill, ...(state.faturas || [])] };
    case "UPDATE_BILL":
      return {
        ...state,
        faturas: (state.faturas || []).map((b) => (b.id === action.bill.id ? action.bill : b)),
      };
    case "DELETE_BILL":
      return {
        ...state,
        faturas: (state.faturas || []).filter((b) => b.id !== action.id),
      };
    case "HYDRATE_STATE":
      return {
        ...state,
        ...action.state,
      };
    default:
      return state;
  }
}

interface FinanceContextValue {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  user?: AuthUser | null;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children, user }: { children: ReactNode; user?: AuthUser | null }) {
  const [state, dispatch] = useReducer(reducer, user?.uid, loadState);
  const [isSynced, setIsSynced] = useState(false);

  // Load from firestore if user is authenticated
  useEffect(() => {
    if (!user?.uid) {
      setIsSynced(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setIsSynced(true);
      return;
    }

    const loadFromFirestore = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudState = docSnap.data() as FinanceState;
          dispatch({ type: "HYDRATE_STATE", state: cloudState });
        } else {
          // Document doesn't exist yet, start from 100% clean zeroed state
          const cleanState: FinanceState = {
            hideBalances: false,
            currentMonth: "Jul",
            transactions: [],
            faturas: [],
            cards: [],
            goals: [],
            budgets: [],
            rules: [],
          };
          dispatch({ type: "HYDRATE_STATE", state: cleanState });
          await setDoc(userDocRef, cleanState, { merge: true }).catch(() => {});
        }
        setIsSynced(true);
      } catch (err: any) {
        console.warn("Sincronização Firebase offline ou limitada:", err?.message || err);
        setIsSynced(true);
      }
    };

    loadFromFirestore();
  }, [user?.uid]);

  // Persist change to local storage and optionally Firestore
  useEffect(() => {
    try {
      const key = getStorageKey(user?.uid);
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — ignore */
    }

    if (user?.uid && isSynced && isFirebaseConfigured) {
      const timer = setTimeout(async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, state, { merge: true });
        } catch (err: any) {
          if (err?.code !== "resource-exhausted") {
            console.warn("Erro ao salvar no Firestore:", err?.message || err);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state, user?.uid, isSynced]);

  return <FinanceContext.Provider value={{ state, dispatch, user }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
