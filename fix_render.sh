sed -i '314,332c\
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
              )}' src/app/App.tsx
