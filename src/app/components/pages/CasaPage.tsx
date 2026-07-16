import React, { useEffect, useState } from "react";
import { Settings, Users, Plus, Receipt, Wallet, Coins } from "lucide-react";
import { useFinance } from "../../store/finance-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../store/firebase";

interface CasaPageProps {
  onOpenSettings: () => void;
}

export function CasaPage({ onOpenSettings }: CasaPageProps) {
  const { user } = useFinance();
  const [homeData, setHomeData] = useState<{name: string, photoURL: string} | null>(null);

  useEffect(() => {
    if (user?.homeId) {
      getDoc(doc(db, "homes", user.homeId)).then(d => {
        if (d.exists()) {
          setHomeData(d.data() as any);
        }
      });
    } else {
      setHomeData(null);
    }
  }, [user?.homeId]);

  return (
    <div className="flex flex-col gap-4 pt-2 pb-32 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shadow-inner">
            {homeData?.photoURL ? (
              <img src={homeData.photoURL} alt="Casa" className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs font-bold uppercase">CASA</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {user?.homeId && homeData?.name ? homeData.name : "Nenhuma Casa"}
            </h2>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {user?.homeId ? "Gestão Compartilhada" : "Toque na engrenagem para criar"}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm active:scale-95"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Balance summary */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balanço do Mês</p>
          <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider">Tudo certo</div>
        </div>
        
        <p className="text-3xl font-black text-foreground tracking-tight font-mono">R$ 0,00</p>
        <p className="text-[11px] text-muted-foreground mt-1">Ninguém deve nada a ninguém neste momento.</p>

        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Você Pagou</p>
            <p className="text-sm font-bold text-foreground font-mono">R$ 0,00</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Parceiro(a) Pagou</p>
            <p className="text-sm font-bold text-foreground font-mono">R$ 0,00</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors shadow-sm active:scale-[0.98]">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold text-foreground">Novo Gasto</span>
        </button>
        <button className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors shadow-sm active:scale-[0.98]">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-1">
            <Coins size={20} />
          </div>
          <span className="text-xs font-bold text-foreground">Acertar Contas</span>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Despesas Recentes</h3>
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <Receipt size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Nenhuma despesa</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">Os gastos compartilhados aparecerão aqui.</p>
        </div>
      </div>
    </div>
  );
}
