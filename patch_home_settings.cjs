const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/HomeSettingsSheet.tsx', 'utf-8');

code = code.replace(
`import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";`,
`import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from "firebase/firestore";`
);

code = code.replace(
`  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");`,
`  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [inviteCode, setInviteCode] = useState("");`
);

code = code.replace(
`    } else if (open && !homeId) {
      setName("");
      setPhotoURL("");
      setPreview("");
      setFile(null);
    }`,
`    } else if (open && !homeId) {
      setName("");
      setPhotoURL("");
      setPreview("");
      setFile(null);
      setInviteCode("");
    }`
);

code = code.replace(
`  const handleSave = async () => {`,
`  const handleJoin = async () => {
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

  const handleSave = async () => {`
);

code = code.replace(
`            {!homeId && (
              <div className="text-center bg-primary/10 text-primary p-4 rounded-xl text-sm font-semibold">
                Você ainda não faz parte de uma Casa. Crie uma agora!
              </div>
            )}`,
`            {!homeId && (
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
            )}`
);

fs.writeFileSync('src/app/components/pages/HomeSettingsSheet.tsx', code);
