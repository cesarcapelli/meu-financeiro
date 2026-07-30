import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  Check,
  ChevronRight,
  Calendar,
  DollarSign,
  Home,
  Car,
  Dog,
  ShoppingBag,
  Tv,
  Users,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Key,
  ShieldCheck,
  Zap,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "../../store/finance-context";
import { money } from "../shared/currency";
import type { Transaction } from "../../store/types";
import { db, isFirebaseConfigured } from "../../store/firebase";
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";

interface OnboardingPageProps {
  onComplete: () => void;
  onBackToDashboard: () => void;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  subText?: string;
  timestamp?: string;
  card?: React.ReactNode;
}

interface IncomeItem {
  id: string;
  desc: string;
  value: number;
  day: number;
  cat: string;
}

interface ExpenseItem {
  id: string;
  desc: string;
  value: number;
  day: number;
  cat: string;
  isSplit?: boolean;
}

export function OnboardingPage({ onComplete, onBackToDashboard }: OnboardingPageProps) {
  const { state, dispatch, user } = useFinance();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Shared home invite state
  const [sharedHome, setSharedHome] = useState<{ id: string; name: string } | null>(null);

  // Conversation stage state
  const [stage, setStage] = useState<
    | "STEP1_SALARY"
    | "STEP1_BENEFITS"
    | "STEP1_ADDING_BENEFIT"
    | "STEP2_LIVING"
    | "STEP2_PARTNER_NAME"
    | "STEP2_HOUSING_TYPE"
    | "STEP2_HOUSING_VALUE"
    | "STEP3_LIFESTYLE"
    | "STEP3_GENERATING"
    | "COMPLETED"
  >("STEP1_SALARY");

  // Collected data state
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [currentBenefitType, setCurrentBenefitType] = useState<string>("");
  
  // Step 1 input state
  const [salaryInput, setSalaryInput] = useState<string>("5000");
  const [salaryDay, setSalaryDay] = useState<number>(5);
  const [benefitValueInput, setBenefitValueInput] = useState<string>("");
  const [benefitDay, setBenefitDay] = useState<number>(20);

  // Step 2 state
  const [livingType, setLivingType] = useState<"sozinho" | "parceiro" | "familia">("sozinho");
  const [partnerName, setPartnerName] = useState<string>("");
  const [housingType, setHousingType] = useState<"aluguel" | "propria">("aluguel");
  const [housingValueInput, setHousingValueInput] = useState<string>("1800");
  const [housingDay, setHousingDay] = useState<number>(10);

  // Step 3 state (lifestyle checkboxes)
  const [hasCar, setHasCar] = useState<boolean>(false);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [hasSupermarket, setHasSupermarket] = useState<boolean>(true);
  const [hasSubscriptions, setHasSubscriptions] = useState<boolean>(true);

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, stage]);

  // Initial setup & shared home detection on mount
  useEffect(() => {
    let homeId: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      homeId = params.get("casa") || params.get("invite") || localStorage.getItem("pending-home-id");
    }

    if (homeId) {
      getDoc(doc(db, "homes", homeId)).then((d) => {
        if (d.exists()) {
          const name = d.data().name || "Nossa Casa";
          setSharedHome({ id: homeId!, name });
          setPartnerName(name);
          setLivingType("parceiro");
          toast.success(`🏡 Convite ativado para "${name}"!`);
        }
      }).catch(console.error);
    }

    // Initialize first AI message
    const initialAiMsg: ChatMessage = {
      id: "msg-welcome",
      sender: "ai",
      text: "Olá! Sou seu assistente financeiro inteligente. 👋\n\nVamos estruturar seu orçamento completo em apenas 3 passos rápidos em formato de conversa.",
      subText: "PASSO 1 DE 3 • Rendas & Benefícios",
    };

    const initialAiQuestion: ChatMessage = {
      id: "msg-salary-q",
      sender: "ai",
      text: "Para começar: **qual é o valor do seu pagamento ou salário principal mensal?**",
    };

    setMessages([initialAiMsg, initialAiQuestion]);
  }, []);

  // Helper to format currency numeric string
  const parseVal = (str: string) => {
    if (!str) return 0;
    const clean = str.replace(/[^\d.,]/g, "").replace(",", ".");
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  // Helper to add chat message
  const addMsg = (msg: Omit<ChatMessage, "id">) => {
    const newMsg = { ...msg, id: `msg-${Date.now()}-${Math.random()}` };
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  };

  // HANDLER: Submit main salary
  const handleConfirmSalary = () => {
    const val = parseVal(salaryInput);
    if (val <= 0) {
      toast.error("Por favor, informe um valor válido de salário.");
      return;
    }

    const newSalary: IncomeItem = {
      id: `inc-salary-${Date.now()}`,
      desc: "Pagamento / Salário",
      value: val,
      day: salaryDay,
      cat: "Renda",
    };

    setIncomes([newSalary]);

    // User message in chat
    addMsg({
      sender: "user",
      text: `Recebo ${money(val)} todo dia ${String(salaryDay).padStart(2, "0")}.`,
    });

    // AI Response
    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: `Excelente! Salário de **${money(val)}** registrado para todo dia **${String(salaryDay).padStart(2, "0")}**. 💵\n\nVocê recebe **outros benefícios ou rendas mensais**?`,
      });
      setStage("STEP1_BENEFITS");
    }, 350);
  };

  // HANDLER: Select benefit option to add
  const handleSelectBenefitType = (type: string) => {
    if (type === "NONE") {
      // User finishes income stage
      const totalRendas = incomes.reduce((acc, i) => acc + i.value, 0);

      addMsg({
        sender: "user",
        text: "Não tenho outros benefícios. Finalizar rendas.",
      });

      setTimeout(() => {
        addMsg({
          sender: "ai",
          text: `Perfeito! Total de rendas mapeadas: **${money(totalRendas)}** em ${incomes.length} lançamento(s). 📊\n\nVamos agora para o **PASSO 2 DE 3: Moradia & Compartilhamento**!`,
          subText: "PASSO 2 DE 3 • Moradia & Compartilhamento",
        });

        // Prompt living question
        setTimeout(() => {
          addMsg({
            sender: "ai",
            text: "**Com quem você compartilha a casa?** Isso define se dividiremos despesas de forma automatizada.",
          });
          setStage("STEP2_LIVING");
        }, 400);
      }, 350);

      return;
    }

    setCurrentBenefitType(type);
    let promptText = "";
    if (type === "Adiantamento") promptText = "Qual é o valor e dia do seu **Adiantamento Salarial**?";
    else if (type === "VA") promptText = "Qual é o valor mensal do seu **Vale Alimentação (VA)** e dia de depósito?";
    else if (type === "VR") promptText = "Qual é o valor mensal do seu **Vale Refeição (VR)** e dia de depósito?";
    else promptText = "Qual é o nome/valor dessa **outra renda** e dia do recebimento?";

    addMsg({
      sender: "user",
      text: `Quero adicionar ${type === "VA" ? "Vale Alimentação" : type === "VR" ? "Vale Refeição" : type}.`,
    });

    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: promptText,
      });
      setBenefitValueInput("");
      setStage("STEP1_ADDING_BENEFIT");
    }, 300);
  };

  // HANDLER: Submit specific benefit
  const handleConfirmBenefit = () => {
    const val = parseVal(benefitValueInput);
    if (val <= 0) {
      toast.error("Informe um valor válido para o benefício.");
      return;
    }

    let name = currentBenefitType;
    let cat = "Benefícios";
    if (currentBenefitType === "Adiantamento") {
      name = "Adiantamento Salarial";
      cat = "Renda";
    } else if (currentBenefitType === "VA") {
      name = "Vale Alimentação (VA)";
    } else if (currentBenefitType === "VR") {
      name = "Vale Refeição (VR)";
    }

    const newBenefit: IncomeItem = {
      id: `inc-ben-${Date.now()}`,
      desc: name,
      value: val,
      day: benefitDay,
      cat,
    };

    setIncomes((prev) => [...prev, newBenefit]);

    addMsg({
      sender: "user",
      text: `${name}: ${money(val)} (Dia ${String(benefitDay).padStart(2, "0")})`,
    });

    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: `Adicionado com sucesso! **${name}** de **${money(val)}** (dia ${String(benefitDay).padStart(2, "0")}).\n\nDeseja adicionar mais algum benefício?`,
      });
      setStage("STEP1_BENEFITS");
    }, 350);
  };

  // HANDLER: Select living arrangement (Step 2)
  const handleSelectLiving = (type: "sozinho" | "parceiro" | "familia") => {
    setLivingType(type);

    let choiceText = "Moro sozinho(a)";
    if (type === "parceiro") choiceText = "Moro com parceiro(a)";
    if (type === "familia") choiceText = "Moro com família/amigos";

    addMsg({
      sender: "user",
      text: choiceText,
    });

    if (type === "parceiro") {
      setTimeout(() => {
        addMsg({
          sender: "ai",
          text: "Ótimo! Ativei a divisão automática de contas em **50/50**. 🤝\n\nQual o nome do seu parceiro(a) para identificação dos gastos divididos?",
        });
        setStage("STEP2_PARTNER_NAME");
      }, 350);
    } else {
      setTimeout(() => {
        addMsg({
          sender: "ai",
          text: "Anotado! Suas despesas serão contabilizadas como 100% pessoais.\n\nSobre a sua **habitação principal**, qual é o modelo atual?",
        });
        setStage("STEP2_HOUSING_TYPE");
      }, 350);
    }
  };

  // HANDLER: Confirm partner name
  const handleConfirmPartnerName = (nameToUse?: string) => {
    const finalName = (nameToUse !== undefined ? nameToUse : partnerName).trim() || "Parceiro(a)";
    setPartnerName(finalName);

    try {
      localStorage.setItem("finance-partner-name", finalName);
    } catch {}

    addMsg({
      sender: "user",
      text: finalName ? `Divisão com: ${finalName}` : "Pular nome",
    });

    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: `Divisão configurada com **${finalName}**! 👥\n\nAgora sobre a sua **habitação principal**, qual é o seu modelo atual?`,
      });
      setStage("STEP2_HOUSING_TYPE");
    }, 350);
  };

  // HANDLER: Select housing type
  const handleSelectHousingType = (type: "aluguel" | "propria") => {
    setHousingType(type);

    addMsg({
      sender: "user",
      text: type === "aluguel" ? "Pago Aluguel" : "Casa Própria / Financiamento",
    });

    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: type === "aluguel"
          ? "Qual é o valor mensal do seu **Aluguel** e o dia do vencimento?"
          : "Qual é o valor estimado mensal com custos fixos da moradia (Parcela/IPTU/Condomínio) e dia de vencimento?",
      });
      setStage("STEP2_HOUSING_VALUE");
    }, 350);
  };

  // HANDLER: Confirm housing value & due day
  const handleConfirmHousingValue = () => {
    const val = parseVal(housingValueInput);
    if (val <= 0) {
      toast.error("Informe um valor válido para a moradia.");
      return;
    }

    const title = housingType === "aluguel" ? "Aluguel" : "Moradia / Financiamento";

    addMsg({
      sender: "user",
      text: `${title}: ${money(val)} todo dia ${String(housingDay).padStart(2, "0")}`,
    });

    setTimeout(() => {
      addMsg({
        sender: "ai",
        text: `${title} de **${money(val)}** registrado para o dia **${String(housingDay).padStart(2, "0")}**! 🏡\n\nTambém adicionarei automaticamente estimativas base de contas essenciais (*Condomínio, Energia, Água e Internet*).\n\nVamos para o **PASSO 3 DE 3: Estilo de Vida e Geração das Finanças**!`,
        subText: "PASSO 3 DE 3 • Estilo de Vida & Geração",
      });

      setTimeout(() => {
        addMsg({
          sender: "ai",
          text: "Para personalizar seus gastos recorrentes, selecione as opções abaixo que fazem parte da sua rotina:",
        });
        setStage("STEP3_LIFESTYLE");
      }, 400);
    }, 350);
  };

  // HANDLER: Skip onboarding
  const handleSkip = async () => {
    if (user?.uid && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, "users", user.uid), { isFirstLogin: false, hasCompletedOnboarding: true }, { merge: true });
      } catch (err) {
        console.error("Erro ao atualizar status de onboarding no Firestore:", err);
      }
    }
    try {
      localStorage.setItem("has-completed-onboarding", "true");
      if (user?.uid) localStorage.setItem(`has-completed-onboarding-${user.uid}`, "true");
      localStorage.removeItem("pending-home-id");
    } catch {}
    toast.info("Onboarding pulado. Você pode configurar suas finanças pelo painel.");
    onComplete();
  };

  // HANDLER: Finalize onboarding & generate full budget in state
  const handleGenerateBudget = async () => {
    setStage("STEP3_GENERATING");

    addMsg({
      sender: "user",
      text: "Finalizar e gerar orçamento completo!",
    });

    // Simulate AI computing
    setTimeout(async () => {
      const currentMonthLabel = state.currentMonth || "Jul";
      const txsToInsert: Transaction[] = [];

      // 1. Add all income transactions
      incomes.forEach((inc) => {
        txsToInsert.push({
          id: `tx-inc-${inc.id}-${Date.now()}`,
          desc: inc.desc,
          cat: inc.cat,
          month: currentMonthLabel,
          date: `${String(inc.day).padStart(2, "0")} ${currentMonthLabel}`,
          value: inc.value,
          type: "in",
          bucket: "variavel",
        });
      });

      // 2. Add Housing expense
      const hVal = parseVal(housingValueInput);
      const isSplit = livingType === "parceiro";
      const userShare = isSplit ? hVal * 0.5 : hVal;

      txsToInsert.push({
        id: `tx-housing-${Date.now()}`,
        desc: housingType === "aluguel" ? "Aluguel" : "Moradia / Financiamento",
        cat: "Fixas",
        month: currentMonthLabel,
        date: `${String(housingDay).padStart(2, "0")} ${currentMonthLabel}`,
        value: -userShare,
        type: "out",
        bucket: "fixo",
        isSplit,
        splitPercent: isSplit ? 50 : undefined,
        splitWith: isSplit ? partnerName || "Parceiro(a)" : undefined,
        originalValue: isSplit ? -hVal : undefined,
      });

      // 3. Add Base Essential Utility Bills
      const baseBills = [
        { desc: "Condomínio / IPTU", val: 320, day: 10 },
        { desc: "Energia & Água", val: 210, day: 15 },
        { desc: "Internet & Fibra", val: 120, day: 15 },
      ];

      baseBills.forEach((b, idx) => {
        const billShare = isSplit ? b.val * 0.5 : b.val;
        txsToInsert.push({
          id: `tx-basebill-${idx}-${Date.now()}`,
          desc: b.desc,
          cat: "Fixas",
          month: currentMonthLabel,
          date: `${String(b.day).padStart(2, "0")} ${currentMonthLabel}`,
          value: -billShare,
          type: "out",
          bucket: "fixo",
          isSplit,
          splitPercent: isSplit ? 50 : undefined,
          splitWith: isSplit ? partnerName || "Parceiro(a)" : undefined,
          originalValue: isSplit ? -b.val : undefined,
        });
      });

      // 4. Add Selected Lifestyle Extras
      if (hasCar) {
        txsToInsert.push({
          id: `tx-car-${Date.now()}`,
          desc: "Combustível / Veículo",
          cat: "Transporte",
          month: currentMonthLabel,
          date: `15 ${currentMonthLabel}`,
          value: -400,
          type: "out",
          bucket: "variavel",
        });
      }

      if (hasPets) {
        txsToInsert.push({
          id: `tx-pet-${Date.now()}`,
          desc: "Petshop / Ração",
          cat: "Outros",
          month: currentMonthLabel,
          date: `20 ${currentMonthLabel}`,
          value: -160,
          type: "out",
          bucket: "variavel",
        });
      }

      if (hasSupermarket) {
        const mktVal = isSplit ? 400 : 800;
        txsToInsert.push({
          id: `tx-mkt-${Date.now()}`,
          desc: "Supermercado",
          cat: "Alimentação",
          month: currentMonthLabel,
          date: `10 ${currentMonthLabel}`,
          value: -mktVal,
          type: "out",
          bucket: "variavel",
          isSplit,
          splitPercent: isSplit ? 50 : undefined,
          splitWith: isSplit ? partnerName || "Parceiro(a)" : undefined,
          originalValue: isSplit ? -800 : undefined,
        });
      }

      if (hasSubscriptions) {
        txsToInsert.push({
          id: `tx-sub-${Date.now()}`,
          desc: "Assinaturas & Streamings",
          cat: "Lazer",
          month: currentMonthLabel,
          date: `05 ${currentMonthLabel}`,
          value: -120,
          type: "out",
          bucket: "variavel",
        });
      }

      // Calculate totals for final summary
      const totalRenda = txsToInsert.filter((t) => t.type === "in").reduce((acc, t) => acc + t.value, 0);
      const totalGastos = txsToInsert.filter((t) => t.type === "out").reduce((acc, t) => acc + Math.abs(t.value), 0);
      const saldoPrevisto = totalRenda - totalGastos;

      // Save to global finance context
      dispatch({ type: "CLEAR_ALL_DATA" });
      dispatch({ type: "ADD_TXS", txs: txsToInsert });

      // Link shared home in Firestore if user arrived via invitation
      if (sharedHome?.id && user?.uid && isFirebaseConfigured) {
        try {
          await updateDoc(doc(db, "homes", sharedHome.id), {
            members: arrayUnion(user.uid),
          });
          await updateDoc(doc(db, "users", user.uid), {
            homeId: sharedHome.id,
          });
        } catch (err) {
          console.error("Erro ao vincular casa no Firestore:", err);
        }
      }

      // Update user status in Firestore and localStorage
      if (user?.uid && isFirebaseConfigured) {
        try {
          await setDoc(doc(db, "users", user.uid), { isFirstLogin: false, hasCompletedOnboarding: true }, { merge: true });
        } catch (err) {
          console.error("Erro ao atualizar status de onboarding no Firestore:", err);
        }
      }

      try {
        localStorage.setItem("has-completed-onboarding", "true");
        if (user?.uid) localStorage.setItem(`has-completed-onboarding-${user.uid}`, "true");
        localStorage.removeItem("pending-home-id");
      } catch {}

      // AI final response card
      addMsg({
        sender: "ai",
        text: "🎉 **Tudo pronto!** Cruzei seus dados e montei seu orçamento completo em **2 ciclos financeiros**!",
        card: (
          <div className="mt-2 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-foreground space-y-2.5 shadow-sm text-xs">
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-2">
              <span className="font-bold text-violet-400 uppercase tracking-wider text-[10px]">Resumo do Orçamento</span>
              <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">Inteligente</span>
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renda Total:</span>
                <span className="font-bold text-emerald-400">{money(totalRenda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despesas Mapeadas:</span>
                <span className="font-bold text-rose-400">{money(totalGastos)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40 font-bold">
                <span className="text-foreground">Saldo Previsto:</span>
                <span className={saldoPrevisto >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {money(saldoPrevisto)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
              Foram gerados {txsToInsert.length} lançamentos com distribuição por datas. Seu painel já está pronto!
            </p>
          </div>
        ),
      });

      setStage("COMPLETED");
      toast.success("Orçamento gerado com sucesso!");
    }, 600);
  };

  return (
    <div className="h-full min-h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-[#09090b] text-foreground overflow-hidden relative font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="shrink-0 px-4 pt-[calc(max(12px,env(safe-area-inset-top)))] pb-3 border-b border-border/60 bg-card/80 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-600 p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#09090b] rounded-full flex items-center justify-center text-primary">
                <Sparkles size={14} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#09090b]" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none tracking-tight flex items-center gap-1.5">
                IA Assistente
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  Online
                </span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">MyFin Conversacional</p>
            </div>
          </div>
        </div>

        {/* Step Indicator Badge & Skip Button */}
        <div className="flex items-center gap-2">
          {stage !== "COMPLETED" && (
            <button
              onClick={handleSkip}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 px-2.5 py-1 rounded-full border border-border/50 transition-colors"
            >
              Pular
            </button>
          )}
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            {stage.startsWith("STEP1") && "Passo 1 / 3"}
            {stage.startsWith("STEP2") && "Passo 2 / 3"}
            {stage.startsWith("STEP3") && "Passo 3 / 3"}
            {stage === "COMPLETED" && "Concluído ✨"}
          </div>
        </div>
      </header>

      {/* Shared Home Invitation Alert Banner */}
      {sharedHome && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-foreground flex items-center gap-2.5 shrink-0 z-10 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Home size={14} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-violet-300">Convite da Residência: {sharedHome.name}</p>
            <p className="text-[10px] text-muted-foreground">Gastos compartilhados serão vinculados automaticamente.</p>
          </div>
        </div>
      )}

      {/* Chat Messages Feed Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-hide scrollable-content">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              {msg.subText && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  {msg.subText}
                </span>
              )}

              <div className="flex gap-2.5 max-w-[88%]">
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                      : "bg-card/90 border border-border/80 text-foreground rounded-tl-xs backdrop-blur-md"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.card}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={chatEndRef} className="h-2" />
      </div>

      {/* Fixed Footer Input & Quick Action Chips */}
      <footer className="shrink-0 border-t border-border/60 bg-card/85 backdrop-blur-xl p-3.5 pb-[calc(max(14px,env(safe-area-inset-bottom)))] space-y-3 z-30 shadow-2xl">
        {/* STAGE 1.1: Main Salary Value & Day Picker */}
        {stage === "STEP1_SALARY" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 bg-muted/40 border border-border/80 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-primary transition-colors">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="5.000,00"
                  className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Day Selection Picker */}
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 rounded-xl px-2.5 py-2">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Dia:</span>
                <select
                  value={salaryDay}
                  onChange={(e) => setSalaryDay(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-card text-foreground">
                      {String(d).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleConfirmSalary}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <span>Confirmar Salário</span>
              <Send size={15} />
            </button>
          </div>
        )}

        {/* STAGE 1.2: Benefit Choice Chips */}
        {stage === "STEP1_BENEFITS" && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => handleSelectBenefitType("Adiantamento")}
                className="px-3.5 py-2 rounded-full bg-muted/60 hover:bg-muted border border-border text-xs font-semibold whitespace-nowrap text-foreground flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} className="text-primary" />
                <span>Adiantamento</span>
              </button>
              <button
                onClick={() => handleSelectBenefitType("VA")}
                className="px-3.5 py-2 rounded-full bg-muted/60 hover:bg-muted border border-border text-xs font-semibold whitespace-nowrap text-foreground flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} className="text-primary" />
                <span>Vale Alimentação (VA)</span>
              </button>
              <button
                onClick={() => handleSelectBenefitType("VR")}
                className="px-3.5 py-2 rounded-full bg-muted/60 hover:bg-muted border border-border text-xs font-semibold whitespace-nowrap text-foreground flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} className="text-primary" />
                <span>Vale Refeição (VR)</span>
              </button>
              <button
                onClick={() => handleSelectBenefitType("Outra Renda")}
                className="px-3.5 py-2 rounded-full bg-muted/60 hover:bg-muted border border-border text-xs font-semibold whitespace-nowrap text-foreground flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} className="text-primary" />
                <span>Outra Renda</span>
              </button>
            </div>

            <button
              onClick={() => handleSelectBenefitType("NONE")}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <span>Concluir Rendas & Ir para Moradia</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STAGE 1.3: Adding Specific Benefit Value */}
        {stage === "STEP1_ADDING_BENEFIT" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 bg-muted/40 border border-border/80 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-primary transition-colors">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={benefitValueInput}
                  onChange={(e) => setBenefitValueInput(e.target.value)}
                  placeholder="Valor mensal"
                  className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 rounded-xl px-2.5 py-2">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Dia:</span>
                <select
                  value={benefitDay}
                  onChange={(e) => setBenefitDay(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-card text-foreground">
                      {String(d).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStage("STEP1_BENEFITS")}
                className="py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBenefit}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
              >
                <span>Adicionar Benefício</span>
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2.1: Living Chips */}
        {stage === "STEP2_LIVING" && (
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleSelectLiving("sozinho")}
              className="w-full py-3 px-4 bg-muted/50 hover:bg-muted border border-border/80 rounded-xl text-left text-xs font-bold text-foreground flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-primary" />
                <span>Moro sozinho(a) (100% Contas Individuais)</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>

            <button
              onClick={() => handleSelectLiving("parceiro")}
              className="w-full py-3 px-4 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded-xl text-left text-xs font-bold text-foreground flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-violet-400" />
                <span className="text-violet-200">Com parceiro(a) (Divisão automática 50/50)</span>
              </div>
              <ChevronRight size={14} className="text-violet-400" />
            </button>

            <button
              onClick={() => handleSelectLiving("familia")}
              className="w-full py-3 px-4 bg-muted/50 hover:bg-muted border border-border/80 rounded-xl text-left text-xs font-bold text-foreground flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Home size={16} className="text-emerald-400" />
                <span>Com família / amigos</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* STAGE 2.2: Partner Name Input */}
        {stage === "STEP2_PARTNER_NAME" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-muted/40 border border-border/80 rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <User size={16} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Ex: Amor, Maria, Lucas..."
                className="w-full bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleConfirmPartnerName("Parceiro(a)")}
                className="py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Pular Nome
              </button>
              <button
                onClick={() => handleConfirmPartnerName()}
                className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
              >
                <span>Confirmar Parceiro(a)</span>
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2.3: Housing Type Chips */}
        {stage === "STEP2_HOUSING_TYPE" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectHousingType("aluguel")}
              className="py-3.5 px-3 bg-muted/50 hover:bg-muted border border-border/80 rounded-xl text-center text-xs font-bold text-foreground flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Key size={20} className="text-amber-400" />
              <span>Pago Aluguel</span>
            </button>

            <button
              onClick={() => handleSelectHousingType("propria")}
              className="py-3.5 px-3 bg-muted/50 hover:bg-muted border border-border/80 rounded-xl text-center text-xs font-bold text-foreground flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Building size={20} className="text-emerald-400" />
              <span>Casa Própria / Financiamento</span>
            </button>
          </div>
        )}

        {/* STAGE 2.4: Housing Value & Due Day */}
        {stage === "STEP2_HOUSING_VALUE" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 bg-muted/40 border border-border/80 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-primary transition-colors">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={housingValueInput}
                  onChange={(e) => setHousingValueInput(e.target.value)}
                  placeholder="1.800,00"
                  className="w-full bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 rounded-xl px-2.5 py-2">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Dia:</span>
                <select
                  value={housingDay}
                  onChange={(e) => setHousingDay(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-card text-foreground">
                      {String(d).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleConfirmHousingValue}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <span>Confirmar Moradia & Avançar</span>
              <Send size={15} />
            </button>
          </div>
        )}

        {/* STAGE 3.1: Lifestyle Chips Toggle */}
        {stage === "STEP3_LIFESTYLE" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHasCar(!hasCar)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  hasCar
                    ? "bg-primary/15 border-primary text-foreground"
                    : "bg-muted/40 border-border/60 text-muted-foreground"
                }`}
              >
                <Car size={16} className={hasCar ? "text-primary" : "text-muted-foreground"} />
                <span className="flex-1 truncate">Tenho Carro / Moto</span>
                {hasCar && <Check size={14} className="text-primary shrink-0" />}
              </button>

              <button
                onClick={() => setHasPets(!hasPets)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  hasPets
                    ? "bg-primary/15 border-primary text-foreground"
                    : "bg-muted/40 border-border/60 text-muted-foreground"
                }`}
              >
                <Dog size={16} className={hasPets ? "text-primary" : "text-muted-foreground"} />
                <span className="flex-1 truncate">Tenho Pets</span>
                {hasPets && <Check size={14} className="text-primary shrink-0" />}
              </button>

              <button
                onClick={() => setHasSupermarket(!hasSupermarket)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  hasSupermarket
                    ? "bg-primary/15 border-primary text-foreground"
                    : "bg-muted/40 border-border/60 text-muted-foreground"
                }`}
              >
                <ShoppingBag size={16} className={hasSupermarket ? "text-primary" : "text-muted-foreground"} />
                <span className="flex-1 truncate">Supermercado</span>
                {hasSupermarket && <Check size={14} className="text-primary shrink-0" />}
              </button>

              <button
                onClick={() => setHasSubscriptions(!hasSubscriptions)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  hasSubscriptions
                    ? "bg-primary/15 border-primary text-foreground"
                    : "bg-muted/40 border-border/60 text-muted-foreground"
                }`}
              >
                <Tv size={16} className={hasSubscriptions ? "text-primary" : "text-muted-foreground"} />
                <span className="flex-1 truncate">Streamings / Apps</span>
                {hasSubscriptions && <Check size={14} className="text-primary shrink-0" />}
              </button>
            </div>

            <button
              onClick={handleGenerateBudget}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-violet-600 text-white font-bold text-sm rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <Zap size={16} />
              <span>Gerar Meu Painel Financeiro</span>
            </button>
          </div>
        )}

        {/* STAGE 3.2: Generating spinner */}
        {stage === "STEP3_GENERATING" && (
          <div className="py-4 flex items-center justify-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs font-semibold font-mono">Cruzando dados e montando orçamento...</span>
          </div>
        )}

        {/* STAGE COMPLETED: Access Dashboard */}
        {stage === "COMPLETED" && (
          <button
            onClick={onComplete}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
          >
            <span>Acessar Meu Painel</span>
            <ChevronRight size={18} />
          </button>
        )}
      </footer>
    </div>
  );
}
