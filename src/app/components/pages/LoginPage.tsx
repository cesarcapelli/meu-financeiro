import { PiggyBank } from "lucide-react";
import { auth, googleProvider, db } from "../../store/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface AuthUser {
  uid: string; id?: string;
  name: string;
  email: string;
  initials: string;
  photoURL?: string;
  provider: "google" | "apple";
  homeId?: string;
}

const MOCK_USERS: Record<AuthUser["provider"], AuthUser> = {
  google: { uid: "demo-google-uid", name: "Ana Martins", email: "ana.martins@gmail.com", initials: "AM", provider: "google" },
  apple: { uid: "demo-apple-uid", name: "Ana Martins", email: "ana.martins@icloud.com", initials: "AM", provider: "apple" },
};

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

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 12.86c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.44-3.68zM14.09 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.29z" />
    </svg>
  );
}

export function LoginPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fUser = result.user;
      const initials = (fUser.displayName || "G")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const userDoc = await getDoc(doc(db, "users", fUser.uid));
      const homeId = userDoc.exists() ? userDoc.data().homeId : undefined;
      const user: AuthUser = {
        uid: fUser.uid,
        name: fUser.displayName || "Usuário Google",
        email: fUser.email || "",
        initials,
        provider: "google",
        photoURL: fUser.photoURL || undefined,
        homeId,
      };
      onLogin(user);
    } catch (err: any) {
      console.error("Erro no login com Google:", err);
      if (err?.code === "auth/network-request-failed" || err?.code === "auth/popup-blocked") {
        toast.info("O preview em iframe bloqueou o pop-up do Google. Entrando em modo de teste para você testar!");
        onLogin(MOCK_USERS.google);
      } else {
        toast.error("Falha ao entrar com Google. Usando modo de teste.");
        onLogin(MOCK_USERS.google);
      }
    }
  };

  const handleTestLogin = () => {
    onLogin(MOCK_USERS.google);
  };

  return (
    <div className="size-full flex items-center justify-center bg-background">
      <div className="relative w-full max-w-[390px] h-full max-h-[844px] bg-background text-foreground flex flex-col overflow-hidden rounded-[40px] shadow-2xl px-8">
        <div className="absolute -right-16 top-10 w-52 h-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 bottom-24 w-44 h-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
            <PiggyBank size={30} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight text-center">Suas finanças, no controle.</h1>
          <p className="text-sm text-muted-foreground text-center mt-2 max-w-[240px]">
            Entre para acompanhar saldo, cartões, orçamentos e metas em um só lugar.
          </p>
        </div>

        <div className="relative flex flex-col gap-3 pb-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-xl py-3.5 text-sm font-semibold text-foreground active:scale-[0.98] transition-transform cursor-pointer hover:bg-muted/30"
          >
            <GoogleMark />
            Continuar com Google
          </button>
          <button
            onClick={handleTestLogin}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer hover:bg-primary/20"
          >
            Entrar como Teste (Começar do 0)
          </button>
          <button
            onClick={() => toast.error("Login com Apple indisponível. Use o Google.")}
            className="w-full flex items-center justify-center gap-3 bg-foreground/90 text-background rounded-xl py-3 text-xs font-medium active:scale-[0.98] transition-transform cursor-pointer opacity-80 hover:opacity-100"
          >
            <AppleMark />
            Continuar com Apple
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-1 leading-relaxed">
            Realize o login com sua conta do Google para sincronização na nuvem, ou clique em Teste para iniciar zerado no iFrame.
          </p>
        </div>
      </div>
    </div>
  );
}
