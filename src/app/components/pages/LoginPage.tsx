import { useState } from "react";
import { PiggyBank, Mail, User, ArrowRight, ShieldCheck } from "lucide-react";
import { auth, googleProvider, db, isFirebaseConfigured } from "../../store/firebase";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface AuthUser {
  uid: string;
  id?: string;
  name: string;
  email: string;
  initials: string;
  photoURL?: string;
  provider: "google" | "email";
  homeId?: string;
  isFirstLogin?: boolean;
  hasCompletedOnboarding?: boolean;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 4.5 29.8 2.5 24 2.5 12.1 2.5 2.5 12.1 2.5 24S12.1 45.5 24 45.5 45.5 35.9 45.5 24c0-1.2-.1-2.4-.3-3.5z" />
      <path fill="#FF3D00" d="M5.3 14.7l6.6 4.8C13.7 15.2 18.5 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6 29.8 4 24 4 15.7 4 8.5 8.8 5.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.7 0 10.7-1.9 14.3-5.1l-6.6-5.6C29.7 34.8 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.3 39.2 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.6C41.1 36.9 45.5 31 45.5 24c0-1.2-.1-2.4-.3-3.5z" />
    </svg>
  );
}

export function LoginPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    if (isFirebaseConfigured) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fUser = result.user;
        const name = fUser.displayName || "Usuário Google";
        const email = fUser.email || "";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        let homeId: string | undefined;
        let isFirstLogin = true;
        let hasCompletedOnboarding = false;

        try {
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            homeId = uData?.homeId;
            hasCompletedOnboarding = uData?.hasCompletedOnboarding === true || uData?.isFirstLogin === false;
            isFirstLogin = uData ? (uData.isFirstLogin ?? !hasCompletedOnboarding) : true;
          }
        } catch {
          /* ignore cloud read error */
        }

        const user: AuthUser = {
          uid: fUser.uid,
          name,
          email,
          initials,
          provider: "google",
          photoURL: fUser.photoURL || undefined,
          homeId,
          isFirstLogin,
          hasCompletedOnboarding,
        };
        onLogin(user);
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn("Google login popup blocked or failed, attempting redirect:", err);
        if (
          err?.code === "auth/popup-blocked" ||
          err?.code === "auth/popup-closed-by-user" ||
          err?.code === "auth/cancelled-popup-request"
        ) {
          try {
            await signInWithRedirect(auth, googleProvider);
            return;
          } catch (redirectErr) {
            console.error("Redirect login error:", redirectErr);
          }
        }
      }
    }

    // If Firebase is not configured or popup blocked, open form so user can enter their real name and email
    setLoading(false);
    setShowEmailForm(true);
    toast.info("Informe seu Nome e E-mail para acessar sua conta.");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = emailName.trim();
    const cleanEmail = emailAddr.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      toast.error("Por favor, preencha seu nome e e-mail.");
      return;
    }

    const initials = cleanName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Create unique deterministic UID based on email address
    const safeUid = `usr_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    // Check if user has previously completed onboarding locally
    const storedCompleted = typeof window !== "undefined" && localStorage.getItem(`has-completed-onboarding-${safeUid}`) === "true";

    const user: AuthUser = {
      uid: safeUid,
      name: cleanName,
      email: cleanEmail,
      initials,
      provider: "email",
      isFirstLogin: !storedCompleted,
      hasCompletedOnboarding: storedCompleted,
    };

    onLogin(user);
  };

  return (
    <div className="size-full flex items-center justify-center bg-background overflow-hidden">
      <div className="relative w-full h-full sm:max-w-[390px] sm:max-h-[844px] bg-background text-foreground flex flex-col overflow-y-auto sm:rounded-[40px] shadow-2xl px-7 pt-[calc(max(24px,env(safe-area-inset-top)))] pb-[calc(max(24px,env(safe-area-inset-bottom)))]">
        <div className="absolute -right-16 top-10 w-52 h-52 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-24 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center relative py-6">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
            <PiggyBank size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight text-center">Suas finanças, no controle.</h1>
          <p className="text-xs text-muted-foreground text-center mt-2 max-w-[260px] leading-relaxed">
            Acompanhe saldos, cartões, despesas da Casa e metas financeiras com total privacidade e isolamento.
          </p>
        </div>

        <div className="relative flex flex-col gap-3.5 pb-4">
          {!showEmailForm ? (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-xl py-3.5 text-sm font-semibold text-foreground active:scale-[0.98] transition-transform cursor-pointer hover:bg-muted/30 shadow-sm"
              >
                <GoogleMark />
                {loading ? "Entrando..." : "Continuar com Google"}
              </button>

              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer hover:bg-primary/15"
              >
                <Mail size={16} />
                Entrar com Nome e E-mail
              </button>
            </>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 bg-card/60 border border-border/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User size={14} className="text-primary" />
                  Criar ou Acessar Conta
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Seu Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Seu E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="mariana@exemplo.com"
                  value={emailAddr}
                  onChange={(e) => setEmailAddr(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3 text-xs mt-1 active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-primary/20"
              >
                <span>Acessar Meu Painel</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center mt-1">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
            <span>Dados isolados e protegidos por conta de usuário</span>
          </div>
        </div>
      </div>
    </div>
  );
}

