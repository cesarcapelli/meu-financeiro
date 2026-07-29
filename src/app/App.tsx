import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard,
  CreditCard,
  Target,
  PiggyBank,
  Bell,
  Search,
  Plus,
  PlusCircle,
  Wallet,
  ArrowRightLeft,
  Eye,
  EyeOff,
  X,
  LogOut,
  ChevronDown,
  Settings, Home,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import { FinanceProvider, useFinance } from "./store/finance-context";
import { signOut } from "firebase/auth";
import { auth, db } from "./store/firebase";
import { lazy, Suspense } from "react";
const DashboardPage = lazy(() => import("./components/pages/DashboardPage").then(module => ({ default: module.DashboardPage })));
const CarteiraPage = lazy(() => import("./components/pages/CarteiraPage").then(module => ({ default: module.CarteiraPage })));
const CasaPage = lazy(() => import("./components/pages/CasaPage").then(module => ({ default: module.CasaPage })));
const OnboardingPage = lazy(() => import("./components/pages/OnboardingPage").then(module => ({ default: module.OnboardingPage })));
import { AddTransactionSheet } from "./components/sheets/AddTransactionSheet";
import { TransactionDetailSheet } from "./components/sheets/TransactionDetailSheet";
import { AddGoalSheet } from "./components/sheets/AddGoalSheet";
import { EditGoalSheet } from "./components/sheets/EditGoalSheet";
import { ContributeGoalSheet } from "./components/sheets/ContributeGoalSheet";
import { EditBudgetSheet } from "./components/sheets/EditBudgetSheet";
import { AddCardSheet } from "./components/sheets/AddCardSheet";
import { AddBudgetSheet } from "./components/sheets/AddBudgetSheet";
import { ImportCsvSheet } from "./components/sheets/ImportCsvSheet";
import { AiInputSheet } from "./components/sheets/AiInputSheet";
import { NewTransactionChoiceSheet } from "./components/sheets/NewTransactionChoiceSheet";
import { HomeSettingsSheet } from "./components/pages/HomeSettingsSheet";
import { LoginPage, type AuthUser } from "./components/pages/LoginPage";
import { BottomSheet } from "./components/shared/BottomSheet";
import { MONTHS } from "./store/seed";
import type { Transaction, Goal, Budget, Card } from "./store/types";
import { money } from "./components/shared/currency";
import { getMonthSummary } from "./store/selectors";

const AUTH_KEY = "finance-app-user-v1";

type Page = "dashboard" | "casa" | "carteira" | "onboarding";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Shell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { state, dispatch } = useFinance();
  const { receitas, despesas, saldo } = getMonthSummary(state, state.currentMonth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Sheet state
  const [addTxCard, setAddTxCard] = useState<string | undefined>();
  const [showAddTx, setShowAddTx] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [showTxChoice, setShowTxChoice] = useState(false);
  const [showHomeSettings, setShowHomeSettings] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const selectedCard = state.cards[Math.min(activeCard, state.cards.length - 1)];

  useEffect(() => {
    if (!menuOpen) {
      setConfirmReset(false);
    }
  }, [menuOpen]);

  const navItems: { id: Page; label: string; icon: any }[] = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
    { id: "casa", label: "Casa", icon: Home },
    { id: "carteira", label: "Carteira", icon: Wallet },
  ];

  const pageTitles: Record<Page, string> = {
    dashboard: `${greeting()}, Ana 👋`,
    carteira: "Carteira",
    casa: "Casa",
    onboarding: "Onboarding",
  };

  const openAddTx = (card?: string) => {
    setAddTxCard(card);
    setShowAddTx(true);
  };

  if (page === "onboarding") {
    return (
      <Suspense fallback={<div className="size-full bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>}>
        <OnboardingPage
          onComplete={() => setPage("dashboard")}
          onBackToDashboard={() => setPage("dashboard")}
        />
      </Suspense>
    );
  }

  return (
    <div className="size-full flex items-center justify-center bg-background">
      <div className="relative w-full max-w-[390px] h-full max-h-[844px] bg-background text-foreground flex flex-col overflow-hidden rounded-[40px] shadow-2xl">
        {/* Header — Unified inline header + balance bar */}
        {page === "dashboard" ? (
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col px-5 pt-5 pb-4 shrink-0 bg-background border-b border-border/40 gap-3 relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-primary/[0.015] blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-primary/[0.015] blur-3xl pointer-events-none" />

            {/* Main high-density row: User identity + Month selector left, Stacked Financials right */}
            <div className="flex justify-between items-start w-full relative z-10 mt-1">
              {/* Left Column: User identity & Month Selection */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Conta"
                  className="active:scale-[0.98] transition-transform shrink-0"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-border" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm">
                      {user.initials}
                    </span>
                  )}
                </button>
                
                <div className="flex flex-col gap-0.5 justify-center">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="text-base font-bold text-foreground tracking-tight text-left active:scale-[0.98] transition-transform"
                  >
                    Olá, {user.name.split(" ")[0]}
                  </button>
                  
                  {/* Month Selector: Inline control below the name */}
                  <div className="relative flex items-center w-fit bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all rounded-md px-2 py-0.5 -ml-1 mt-0.5">
                    <select
                      value={state.currentMonth}
                      onChange={(e) => dispatch({ type: "SET_MONTH", month: e.target.value })}
                      className="appearance-none bg-transparent rounded border-0 outline-none text-[11px] font-semibold text-muted-foreground hover:text-foreground pr-4 py-0 pl-0 cursor-pointer focus:ring-0 active:scale-[0.98] transition-all"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m} className="bg-card text-foreground">
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60">
                      <ChevronDown size={10} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-density vertical financial stack */}
              <button
                onClick={() => setPage("transacoes")}
                className="flex flex-col items-end text-right space-y-0.5 active:scale-[0.99] transition-transform cursor-pointer group"
              >
                {/* Line 1: Balance */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Conta</span>
                  <span className="text-sm font-extrabold text-foreground font-sans tracking-tight group-hover:text-primary transition-colors">
                    {money(saldo, state.hideBalances)}
                  </span>
                  <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {/* Line 2: Incomes */}
                <div className="text-[10px] text-muted-foreground/70 font-semibold leading-none pt-0.5">
                  Receitas: <span className={`font-bold font-mono ${receitas > 0 ? "text-green-500" : "text-muted-foreground"}`}>{money(receitas, state.hideBalances, "••••")}</span>
                </div>

                {/* Line 3: Expenses */}
                <div className="text-[10px] text-muted-foreground/70 font-semibold leading-none">
                  Despesas: <span className={`font-bold font-mono ${despesas > 0 ? "text-red-500" : "text-muted-foreground"}`}>{money(despesas, state.hideBalances, "••••")}</span>
                </div>
              </button>
            </div>
          </motion.header>
        ) : (
          <header className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
            <h1 className="text-lg font-bold text-foreground leading-tight">{pageTitles[page]}</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={state.currentMonth}
                  onChange={(e) => dispatch({ type: "SET_MONTH", month: e.target.value })}
                  className="appearance-none bg-card border border-border rounded-full pl-3 pr-7 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer focus:border-primary active:scale-[0.98] transition-all"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown size={11} />
                </div>
              </div>

              {page === "cartoes" && (
                <>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_HIDE" })}
                    aria-label="Alternar visibilidade dos saldos"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border cursor-pointer active:scale-95 transition-transform"
                  >
                    {state.hideBalances ? <EyeOff size={15} className="text-muted-foreground" /> : <Eye size={15} className="text-muted-foreground" />}
                  </button>
                  {selectedCard && (
                    <>
                      <motion.button
                        onClick={() => {
                          setCardToEdit(selectedCard);
                          setShowAddCard(true);
                        }}
                        whileHover={{ scale: 1.05, rotate: 20 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer shrink-0"
                        title="Editar este cartão"
                        aria-label="Editar este cartão"
                      >
                        <Settings size={15} />
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setCardToEdit(null);
                          setShowAddCard(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-primary hover:bg-muted/50 transition-all cursor-pointer shrink-0"
                        title="Novo cartão"
                        aria-label="Novo cartão"
                      >
                        <Plus size={15} />
                      </motion.button>
                    </>
                  )}
                </>
              )}
              {page === "carteira" && (
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Buscar"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border"
                >
                  <Search size={15} className="text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Conta"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.initials
                )}
              </button>
            </div>
          </header>
        )}

        {/* Search bar */}
        {page === "carteira" && searchOpen && (
          <div className="px-5 pb-3 shrink-0">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar transações..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Limpar busca">
                  <X size={13} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <Suspense fallback={
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider">Carregando...</span>
                </div>
              }>
                {page === "dashboard" && (
                  <DashboardPage
                    onOpenTx={setDetailTx}
                    onAdd={() => setShowTxChoice(true)}
                    goTo={setPage}
                    onStartOnboarding={() => setPage("onboarding")}
                    onOpenAiInput={() => setShowAiInput(true)}
                  />
                )}
                {page === "casa" && <CasaPage onOpenSettings={() => setShowHomeSettings(true)} />}
                {page === "carteira" && (
                  <CarteiraPage
                    search={search}
                    onOpenTx={setDetailTx}
                    onImport={() => setShowImport(true)}
                    onAddCard={() => {
                      setCardToEdit(null);
                      setShowAddCard(true);
                    }}
                    onEditCard={(c) => {
                      setCardToEdit(c);
                      setShowAddCard(true);
                    }}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Integrated Clean Navigation Bar */}
        <nav className="shrink-0 flex items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur-md px-3 pb-4 pt-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-50">
          {/* Início */}
          <button
            onClick={() => setPage("dashboard")}
            aria-label="Início"
            className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors cursor-pointer ${page === "dashboard" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {page === "dashboard" && (
              <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-muted" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <LayoutDashboard size={20} strokeWidth={page === "dashboard" ? 2.5 : 1.8} className="relative" />
            <span className="text-[10px] font-semibold tracking-wide relative">Início</span>
          </button>

          {/* Casa */}
          <button
            onClick={() => setPage("casa")}
            aria-label="Casa"
            className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors cursor-pointer ${page === "casa" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {page === "casa" && (
              <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-muted" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <Home size={20} strokeWidth={page === "casa" ? 2.5 : 1.8} className="relative" />
            <span className="text-[10px] font-semibold tracking-wide relative">Casa</span>
          </button>

          {/* Novo Lançamento */}
          <button
            onClick={() => setShowTxChoice(true)}
            aria-label="Novo Lançamento"
            className="relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors cursor-pointer text-muted-foreground hover:text-foreground active:scale-95"
          >
            <PlusCircle size={20} strokeWidth={1.8} className="relative" />
            <span className="text-[10px] font-semibold tracking-wide relative">Novo</span>
          </button>

          {/* Carteira */}
          <button
            onClick={() => setPage("carteira")}
            aria-label="Carteira"
            className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors cursor-pointer ${page === "carteira" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {page === "carteira" && (
              <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-muted" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <Wallet size={20} strokeWidth={page === "carteira" ? 2.5 : 1.8} className="relative" />
            <span className="text-[10px] font-semibold tracking-wide relative">Carteira</span>
          </button>
        </nav>
      </div>

      {/* Sheets */}
      <NewTransactionChoiceSheet
        open={showTxChoice}
        onClose={() => setShowTxChoice(false)}
        onSelectAi={() => setShowAiInput(true)}
        onSelectManual={() => openAddTx()}
      />
      <AddTransactionSheet open={showAddTx} onClose={() => setShowAddTx(false)} defaultCard={addTxCard} />
      <TransactionDetailSheet tx={detailTx} onClose={() => setDetailTx(null)} />
      <AddGoalSheet open={showAddGoal} onClose={() => setShowAddGoal(false)} />
      <EditGoalSheet goal={editGoal} onClose={() => setEditGoal(null)} />
      <ContributeGoalSheet goal={contributeGoal} onClose={() => setContributeGoal(null)} />
      <EditBudgetSheet budget={editBudget} onClose={() => setEditBudget(null)} />
      <AddCardSheet
        open={showAddCard}
        onClose={() => {
          setShowAddCard(false);
          setCardToEdit(null);
        }}
        cardToEdit={cardToEdit}
      />
      <AddBudgetSheet open={showAddBudget} onClose={() => setShowAddBudget(false)} />
      <ImportCsvSheet open={showImport} onClose={() => setShowImport(false)} />
      <AiInputSheet open={showAiInput} onClose={() => setShowAiInput(false)} />
      <HomeSettingsSheet open={showHomeSettings} onClose={() => setShowHomeSettings(false)} homeId={user.homeId || ""} />

      {/* Account sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Conta">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden border border-border">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.initials
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {user.homeId && (
            <button
              onClick={() => {
                setMenuOpen(false);
                setShowHomeSettings(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Settings size={15} /> Configurações da Casa
            </button>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              setPage("onboarding");
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/15 to-violet-500/15 text-primary hover:from-emerald-500/25 hover:to-violet-500/25 border border-primary/20 font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles size={15} className="text-amber-500 animate-pulse" /> Configurar Onboarding
          </button>

          <button
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
              } else {
                dispatch({ type: "CLEAR_ALL_DATA" });
                toast.success("Todos os dados, transações e saldos foram zerados!");
                setConfirmReset(false);
                setMenuOpen(false);
              }
            }}
            className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-all ${
              confirmReset
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20"
            }`}
          >
            {confirmReset ? "Confirmar: Apagar tudo mesmo?" : "Zerar todos os dados e saldos"}
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--popover)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubUserDoc = () => {};
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          try {
            const { doc, onSnapshot } = await import("firebase/firestore");
            unsubUserDoc = onSnapshot(doc(db, "users", fUser.uid), (userDoc) => {
              const homeId = userDoc.exists() ? userDoc.data().homeId : undefined;
              const initials = (fUser.displayName || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              
              setUser({
                uid: fUser.uid,
                name: fUser.displayName || "Usuário",
                email: fUser.email || "",
                initials,
                provider: "google",
                photoURL: fUser.photoURL || undefined,
                homeId
              });
              setReady(true);
            });
          } catch (e) {
            console.error("Error loading user data", e);
            setUser(null);
            setReady(true);
          }
        } else {
          unsubUserDoc();
          setUser(null);
          setReady(true);
        }
      });
    });
    return () => unsubUserDoc();
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    toast.success(`Bem-vinda, ${u.name.split(" ")[0]}!`);
  };

  const logout = () => {
    try {
      signOut(auth).then(() => setUser(null)).catch((err) => console.error("Error signing out from Firebase:", err));
    } catch {
      /* ignore */
    }
  };

  if (!ready) return <div className="size-full bg-background" />;

  return (
    <>
      {user ? (
        <FinanceProvider user={user}>
          <Shell user={user} onLogout={logout} />
        </FinanceProvider>
      ) : (
        <LoginPage onLogin={login} />
      )}
      <AppToaster />
    </>
  );
}
