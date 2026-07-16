const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`            <motion.div
              key={page}
              initial={{ opacity: 0, x: 12, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              {page === "dashboard" && (
                <DashboardPage
                  onOpenTx={setDetailTx}
                  onAdd={() => openAddTx()}
                  goTo={setPage}
                  onStartOnboarding={() => setPage("onboarding")}
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
            </motion.div>`,
`            <motion.div
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
                    onAdd={() => openAddTx()}
                    goTo={setPage}
                    onStartOnboarding={() => setPage("onboarding")}
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
            </motion.div>`
);

fs.writeFileSync('src/app/App.tsx', code);
