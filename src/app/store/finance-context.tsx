import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react";
import type { FinanceState, FinanceAction } from "./types";
import { initialState } from "./seed";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { toast } from "sonner";
import type { AuthUser } from "../components/pages/LoginPage";

const STORAGE_KEY = "finance-app-state-v1";

// Hydrate from localStorage, falling back to the seed data.
function loadState(): FinanceState {
  if (typeof window === "undefined") return { faturas: [], ...initialState };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { faturas: [], ...initialState };
    const parsed = JSON.parse(raw);
    // Shallow-merge so newly added fields keep their defaults.
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
        cards: state.cards.map((c) => ({ ...c, current: 0 })),
        goals: state.goals.map((g) => ({ ...g, atual: 0 })),
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
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [isSynced, setIsSynced] = useState(false);

  // Load from firestore if user is authenticated
  useEffect(() => {
    if (!user) {
      setIsSynced(false);
      return;
    }

    const loadFromFirestore = async () => {
      try {
        const userDocRef = doc(db, "users", (user as any).uid || (user as any).id);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudState = docSnap.data() as FinanceState;
          dispatch({ type: "HYDRATE_STATE", state: cloudState });
          toast.success("Dados sincronizados com a nuvem!");
        } else {
          // Document doesn't exist yet, save the current state to firestore to seed it
          await setDoc(userDocRef, state);
          toast.success("Sua conta foi conectada e os dados salvos na nuvem!");
        }
        setIsSynced(true);
      } catch (err) {
        console.error("Erro ao sincronizar com Firebase:", err);
        toast.error("Erro ao carregar dados da nuvem.");
      }
    };

    loadFromFirestore();
  }, [user?.uid]);

  // Persist change to local storage and optionally Firestore
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — ignore */
    }

    if (user && isSynced) {
      const saveToFirestore = async () => {
        try {
          const userDocRef = doc(db, "users", (user as any).uid || (user as any).id);
          await setDoc(userDocRef, state);
        } catch (err) {
          console.error("Erro ao salvar no Firestore:", err);
        }
      };
      saveToFirestore();
    }
  }, [state, user?.uid, isSynced]);

  return <FinanceContext.Provider value={{ state, dispatch, user }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
