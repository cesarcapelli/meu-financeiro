sed -i '315,334c\
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
        </main>' src/app/App.tsx
