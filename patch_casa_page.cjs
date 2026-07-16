const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/CasaPage.tsx', 'utf-8');

code = code.replace(
`  useEffect(() => {
    if (user?.homeId) {
      getDoc(doc(db, "homes", user.homeId)).then(d => {
        if (d.exists()) {
          setHomeData(d.data() as any);
        }
      });
    }
  }, [user?.homeId]);`,
`  useEffect(() => {
    if (user?.homeId) {
      getDoc(doc(db, "homes", user.homeId)).then(d => {
        if (d.exists()) {
          setHomeData(d.data() as any);
        }
      });
    } else {
      setHomeData(null);
    }
  }, [user?.homeId]);`
);

code = code.replace(
`        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shadow-inner">
            {homeData?.photoURL ? (
              <img src={homeData.photoURL} alt="Casa" className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs font-bold uppercase">CASA</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {homeData?.name || "Minha Casa"}
            </h2>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Gestão Compartilhada
            </p>
          </div>
        </div>`,
`        <div className="flex items-center gap-3">
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
        </div>`
);

fs.writeFileSync('src/app/components/pages/CasaPage.tsx', code);
