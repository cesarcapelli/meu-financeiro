sed -i '305,340c\
              {page === "dashboard" && (\
                <DashboardPage\
                  onOpenTx={setDetailTx}\
                  onAdd={() => openAddTx()}\
                  goTo={setPage}\
                  onStartOnboarding={() => setPage("onboarding")}\
                />\
              )}\
              {page === "carteira" && (\
                <CarteiraPage\
                  search={search}\
                  onOpenTx={setDetailTx}\
                  onImport={() => setShowImport(true)}\
                  onAddCard={() => {\
                    setCardToEdit(null);\
                    setShowAddCard(true);\
                  }}\
                  onEditCard={(c) => {\
                    setCardToEdit(c);\
                    setShowAddCard(true);\
                  }}\
                />\
              )}\
            </motion.div>\
          </AnimatePresence>\
        </main>\
        <nav className="shrink-0 flex items-center justify-around border-t border-border bg-background px-2 pb-4 pt-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-50">\
          {navItems.map((item, index) => {\
            const active = page === item.id;\
            const Icon = item.icon;\
            const elements = [];' src/app/App.tsx
