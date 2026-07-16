import React, { useState, useEffect } from "react";
import { BottomSheet } from "../shared/BottomSheet";
import { Home, Camera, Loader2, Save } from "lucide-react";
import { db } from "../../store/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import { useFinance } from "../../store/finance-context";

interface HomeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  homeId: string;
}

export function HomeSettingsSheet({ open, onClose, homeId }: HomeSettingsSheetProps) {
  const { user } = useFinance();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (open && homeId) {
      loadHome();
    } else if (open && !homeId) {
      setName("");
      setPhotoURL("");
      setPreview("");
      setFile(null);
      setInviteCode("");
    }
  }, [open, homeId]);

  const loadHome = async () => {
    setLoading(true);
    try {
      const d = await getDoc(doc(db, "homes", homeId));
      if (d.exists()) {
        const data = d.data();
        setName(data.name || "");
        setPhotoURL(data.photoURL || "");
        setPreview(data.photoURL || "");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar os dados da casa.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);
    try {
      const homeDoc = await getDoc(doc(db, "homes", inviteCode.trim()));
      if (homeDoc.exists()) {
        await updateDoc(doc(db, "homes", inviteCode.trim()), {
          members: arrayUnion((user as any).uid || (user as any).id)
        });
        await updateDoc(doc(db, "users", (user as any).uid || (user as any).id), {
          homeId: inviteCode.trim()
        });
        toast.success("Você entrou na casa!");
        onClose();
      } else {
        toast.error("Código inválido. Casa não encontrada.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao entrar na casa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let targetHomeId = homeId;
      let newPhotoUrl = photoURL;
      
      // se nao tem homeId, cria uma nova
      if (!targetHomeId) {
        if (!user) {
          toast.error("Você precisa estar logado.");
          return;
        }
        const newHomeRef = await addDoc(collection(db, "homes"), {
          name: name || "Minha Casa",
          photoURL: "",
          members: [(user as any).uid || (user as any).id]
        });
        targetHomeId = newHomeRef.id;
        
        // update user
        await updateDoc(doc(db, "users", (user as any).uid || (user as any).id), {
          homeId: targetHomeId
        });
        
        // Wait, does the context update automatically?
        // We might need to rely on the onSnapshot in App.tsx or similar to pick it up, 
        // or just let the user know.
      }

      if (file) {
        // Convert to base64 to store in Firestore (since Storage bucket might not be configured)
        newPhotoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      }

      await updateDoc(doc(db, "homes", targetHomeId), {
        name,
        photoURL: newPhotoUrl
      });

      toast.success("Configurações atualizadas!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={homeId ? "Configurações da Casa" : "Criar uma Casa"}>
      <div className="flex flex-col gap-6 pb-6">
        {loading && !name && homeId ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {!homeId && (
              <>
                <div className="text-center bg-primary/10 text-primary p-4 rounded-xl text-sm font-semibold">
                  Você ainda não faz parte de uma Casa. Crie uma agora ou entre usando um código!
                </div>
                <div className="flex flex-col gap-2 mt-2 p-4 border border-border rounded-xl bg-muted/30">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Entrar em uma casa existente</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Código de Convite (ID)"
                      className="flex-1 bg-input-background border border-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-colors text-foreground"
                    />
                    <button
                      onClick={handleJoin}
                      disabled={loading || !inviteCode.trim()}
                      className="bg-primary text-primary-foreground font-bold px-4 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-px bg-border flex-1"></div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">OU CRIAR NOVA</span>
                  <div className="h-px bg-border flex-1"></div>
                </div>
              </>
            )}
            
            {homeId && (
              <div className="flex flex-col gap-2 mb-2 p-4 border border-border rounded-xl bg-muted/30">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Código de Convite</label>
                <div className="flex items-center justify-between bg-input-background border border-border rounded-lg px-4 py-3">
                  <span className="text-sm font-mono text-foreground font-semibold truncate select-all">{homeId}</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(homeId); toast.success("Código copiado!"); }}
                    className="text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">Envie este código para quem deseja convidar para a casa.</p>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Casa" className="w-full h-full object-cover" />
                  ) : (
                    <Home size={32} className="text-muted-foreground" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.3)] active:scale-95 transition-transform border border-primary/50">
                  <Camera size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Foto do Perfil da Casa</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome da Residência</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Casa"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading || (!name.trim() && !file && homeId)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-xl text-sm active:scale-[0.98] shadow-lg shadow-primary/20 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {homeId ? "Salvar Alterações" : "Criar Casa"}</>}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
