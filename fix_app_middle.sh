sed -i '332,342c\
          {navItems.map((item, index) => {\
            const active = page === item.id;\
            const Icon = item.icon;\
            const elements = [];\
            if (index === 1) {\
              elements.push(\
                <button\
                  key="add-tx-center"\
                  onClick={() => openAddTx()}\
                  aria-label="Nova transação"\
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 active:scale-90 transition-all shrink-0 hover:bg-primary/95"\
                >\
                  <Plus size={20} className="text-primary-foreground" strokeWidth={2.5} />\
                </button>\
              );\
            }\
            elements.push(' src/app/App.tsx
