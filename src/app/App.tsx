import { useState, useEffect, useRef } from "react";
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
  RotateCcw,
} from "lucide-react";

import { FinanceProvider, useFinance } from "./store/finance-context";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./store/firebase";
import { StackedAvatars, type ProfileType } from "./components/shared/StackedAvatars";
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

function NavButton({
  label,
  tooltip,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  tooltip: string;
  icon: any;
  isActive?: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<any>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -42, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full mb-2 px-2.5 py-1 rounded-xl bg-popover/95 text-popover-foreground border border-border/80 shadow-md text-[11px] font-medium whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5"
          >
            <span>{tooltip}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover/95" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          endPress();
          setShowTooltip(false);
        }}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        aria-label={label}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer select-none ${
          isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground font-medium"
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/20"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
        <span className="text-xs tracking-tight relative z-10">{label}</span>
      </button>
    </div>
  );
}

function NavActionButton({
  label,
  tooltip,
  icon: Icon,
  onClick,
}: {
  label: string;
  tooltip: string;
  icon: any;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<any>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -48, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full mb-2 px-2.5 py-1 rounded-xl bg-popover/95 text-popover-foreground border border-border/80 shadow-md text-[11px] font-medium whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5"
          >
            <span>{tooltip}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover/95" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          endPress();
          setShowTooltip(false);
        }}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        aria-label={label}
        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-90 transition-all cursor-pointer select-none"
      >
        <Icon size={20} strokeWidth={2.5} className="transition-transform group-hover:rotate-90 duration-300" />
      </button>
    </div>
  );
}

function Shell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { state, dispatch } = useFinance();
  const { receitas, despesas, saldo } = getMonthSummary(state, state.currentMonth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileType>("personal");

  // Route Guard verification for onboarding status
  const isUserOnboarded = Boolean(
    user?.hasCompletedOnboarding === true ||
    user?.isFirstLogin === false ||
    (typeof window !== "undefined" && user?.uid && localStorage.getItem(`has-completed-onboarding-${user.uid}`) === "true")
  );

  const [page, setPage] = useState<Page>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const casaId = params.get("casa") || params.get("invite");
      if (casaId) {
        try { localStorage.setItem("pending-home-id", casaId); } catch {}
        return "onboarding";
      }
    }
    return isUserOnboarded ? "dashboard" : "onboarding";
  });

  // ROUTE GUARD EFFECT: Force user to onboarding page if first login or onboarding incomplete
  useEffect(() => {
    if (!isUserOnboarded && page !== "onboarding") {
      setPage("onboarding");
      toast.info("Primeiro acesso! Por favor, conclua a entrevista com a Lud para liberar seu painel.");
    }
  }, [isUserOnboarded, page]);
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
  const [homeData, setHomeData] = useState<{ name?: string; photoURL?: string } | null>(null);
  const selectedCard = state.cards[Math.min(activeCard, state.cards.length - 1)];

  // Fetch house photo and name from Firestore
  useEffect(() => {
    if (user?.homeId) {
      getDoc(doc(db, "homes", user.homeId)).then((d) => {
        if (d.exists()) {
          const data = d.data() as any;
          setHomeData(data);
          if (data.name) {
            try { localStorage.setItem("finance-house-name", data.name); } catch {}
          }
        }
      });
    } else {
      const cachedName = typeof window !== "undefined" ? localStorage.getItem("finance-house-name") : null;
      if (cachedName) {
        setHomeData({ name: cachedName, photoURL: "" });
      } else {
        setHomeData(null);
      }
    }
  }, [user?.homeId, showHomeSettings]);

  // Keep page and activeProfile synchronized
  useEffect(() => {
    if (page === "casa") {
      setActiveProfile("casa");
    } else if (page === "dashboard") {
      setActiveProfile("personal");
    }
  }, [page]);

  useEffect(() => {
    if (!menuOpen) {
      setConfirmReset(false);
    }
  }, [menuOpen]);

  const navItems: { id: Page; label: string; icon: any }[] = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
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
          onComplete={() => {
            if (user) {
              user.hasCompletedOnboarding = true;
              user.isFirstLogin = false;
            }
            try {
              localStorage.setItem("has-completed-onboarding", "true");
              if (user?.uid) localStorage.setItem(`has-completed-onboarding-${user.uid}`, "true");
            } catch {}
            setPage("dashboard");
          }}
          onBackToDashboard={() => {
            if (!isUserOnboarded) {
              toast.warning("Para acessar o painel principal, conclua ou pule a entrevista de boas-vindas.");
              return;
            }
            setPage("dashboard");
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="size-full flex items-center justify-center bg-background overflow-hidden">
      <div className="relative w-full h-full sm:max-w-[390px] sm:max-h-[844px] bg-background text-foreground flex flex-col overflow-hidden sm:rounded-[40px] shadow-2xl">
        {/* Header — Unified inline header + balance bar */}
        {page === "dashboard" || page === "casa" ? (
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col px-5 pt-[calc(max(20px,env(safe-area-inset-top)))] pb-4 shrink-0 bg-background border-b border-border/40 gap-3 relative z-30"
          >
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-primary/[0.015] blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-primary/[0.015] blur-3xl pointer-events-none" />

            {/* Main high-density row: User identity + Month selector left, Stacked Financials right */}
            <div className="flex justify-between items-start w-full relative z-10 mt-1">
              {/* Left Column: User identity & Month Selection */}
              <div className="flex items-center gap-3 mt-1">
                <StackedAvatars
                  activeProfile={activeProfile}
                  personalProfile={{
                    id: user.uid,
                    name: user.name,
                    photoURL: user.photoURL,
                    initials: user.initials,
                    subtitle: "Conta Pessoal",
                  }}
                  casaProfile={{
                    id: user.homeId || "casa",
                    name: homeData?.name || "Nossa Casa",
                    photoURL: homeData?.photoURL || "",
                    subtitle: user.homeId ? "Gestão Compartilhada" : "Criar/Acessar Casa",
                  }}
                  onProfileChange={(newProfile) => {
                    setActiveProfile(newProfile);
                    if (newProfile === "casa") {
                      setPage("casa");
                      toast.info("Perfil Casa selecionado");
                    } else {
                      setPage("dashboard");
                      toast.info("Perfil Pessoal selecionado");
                    }
                  }}
                  onOpenSettings={(prof) => {
                    if (prof === "casa") {
                      setShowHomeSettings(true);
                    } else {
                      setMenuOpen(true);
                    }
                  }}
                  size="md"
                />
                
                <div className="flex flex-col gap-0.5 justify-center">
                  <button
                    onClick={() => {
                      if (activeProfile === "casa") {
                        setShowHomeSettings(true);
                      } else {
                        setMenuOpen(true);
                      }
                    }}
                    className="text-base font-bold text-foreground tracking-tight text-left active:scale-[0.98] transition-transform truncate max-w-[140px]"
                  >
                    {activeProfile === "casa" ? (homeData?.name || "Nossa Casa") : `Olá, ${user.name.split(" ")[0]}`}
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
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Saldo do Mês</span>
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
        <main className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
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

        {/* Floating Pill Navigation Bar (Estilo Nubank / WhatsApp / Instagram com Tooltips e mesmo background do main) */}
        <nav className="absolute bottom-[calc(max(10px,env(safe-area-inset-bottom)))] left-1/2 -translate-x-1/2 w-[300px] bg-background/95 backdrop-blur-xl border border-border/80 rounded-full pl-2 pt-1.5 pr-2 pb-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-around z-50">
          {/* Início */}
          <NavButton
            label="Início"
            tooltip="Início: Fluxo e resumo das finanças"
            icon={LayoutDashboard}
            isActive={page === "dashboard"}
            onClick={() => {
              setActiveProfile("personal");
              setPage("dashboard");
            }}
          />

          {/* Center Action Button: Plus / Novo */}
          <NavActionButton
            label="Novo"
            tooltip="Novo: Registrar movimentação"
            icon={PlusCircle}
            onClick={() => setShowTxChoice(true)}
          />

          {/* Carteira */}
          <NavButton
            label="Carteira"
            tooltip="Carteira: Cartões, bancos e limites"
            icon={Wallet}
            isActive={page === "carteira"}
            onClick={() => setPage("carteira")}
          />
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
            onClick={async () => {
              if (!confirmReset) {
                setConfirmReset(true);
              } else {
                try {
                  dispatch({ type: "CLEAR_ALL_DATA" });
                  
                  // Clear localStorage
                  localStorage.removeItem("has-completed-onboarding");
                  localStorage.removeItem("finance-app-state-v1");
                  localStorage.removeItem("finance-house-name");
                  localStorage.removeItem("pending-home-id");
                  if (user?.uid) {
                    localStorage.removeItem(`has-completed-onboarding-${user.uid}`);
                    localStorage.removeItem(`finance-app-state-${user.uid}`);
                  }

                  // Update user state flags
                  if (user) {
                    user.isFirstLogin = true;
                    user.hasCompletedOnboarding = false;
                    user.homeId = undefined;
                  }

                  // Update Firestore
                  if (user?.uid && isFirebaseConfigured) {
                    const { doc, setDoc, deleteField } = await import("firebase/firestore");
                    await setDoc(doc(db, "users", user.uid), {
                      isFirstLogin: true,
                      hasCompletedOnboarding: false,
                      homeId: deleteField(),
                      transactions: [],
                      faturas: [],
                      cards: [],
                      goals: [],
                      budgets: [],
                      rules: [],
                    }, { merge: true });
                  }

                  toast.success("Todos os dados, casa e onboarding foram zerados! Redirecionando...");
                  setConfirmReset(false);
                  setMenuOpen(false);
                  setPage("onboarding");
                } catch (err) {
                  console.error("Erro ao resetar dados:", err);
                  toast.error("Erro ao zerar dados. Tente novamente.");
                }
              }
            }}
            className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-all cursor-pointer ${
              confirmReset
                ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/20"
                : "bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20"
            }`}
          >
            <RotateCcw size={15} />
            {confirmReset ? "Confirmar: Zerar TUDO (Dados, Casa e Onboarding)?" : "Zerar todos os dados & Testar Onboarding"}
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
      duration={2000}
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
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("current-auth-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(true);

  // Sync state to localStorage whenever user changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("current-auth-user", JSON.stringify(user));
      } else {
        localStorage.removeItem("current-auth-user");
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setReady(true);
      return;
    }
    import("firebase/auth").then(({ onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence }) => {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
      getRedirectResult(auth).catch(() => {});

      onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          try {
            const { doc, getDoc, setDoc } = await import("firebase/firestore");
            const userRef = doc(db, "users", fUser.uid);
            const userDoc = await getDoc(userRef).catch(() => null);

            let homeId: string | undefined;
            let isFirstLogin = true;
            let hasCompletedOnboarding = false;

            if (userDoc && userDoc.exists()) {
              const uData = userDoc.data();
              homeId = uData.homeId;
              hasCompletedOnboarding = uData.hasCompletedOnboarding === true || uData.isFirstLogin === false;
              isFirstLogin = uData.isFirstLogin ?? !hasCompletedOnboarding;
            } else {
              await setDoc(userRef, {
                isFirstLogin: true,
                hasCompletedOnboarding: false,
                name: fUser.displayName || "Usuário",
                email: fUser.email || "",
                createdAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
            }

            const name = fUser.displayName || "Usuário";
            const email = fUser.email || "";
            const photoURL = fUser.photoURL || undefined;
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            setUser({
              uid: fUser.uid,
              name,
              email,
              initials,
              provider: "google",
              photoURL,
              homeId,
              isFirstLogin,
              hasCompletedOnboarding,
            });
            setReady(true);
          } catch (e) {
            console.error("Error loading user data", e);
            setReady(true);
          }
        } else {
          setReady(true);
        }
      });
    });
  }, []);

  const login = (u: AuthUser) => {
    try {
      localStorage.setItem("current-auth-user", JSON.stringify(u));
    } catch {}
    setUser(u);
    toast.success(`Bem-vindo(a), ${u.name.split(" ")[0]}!`);
  };

  const logout = () => {
    try {
      localStorage.removeItem("current-auth-user");
      signOut(auth).then(() => setUser(null)).catch(() => setUser(null));
    } catch {
      setUser(null);
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
