sed -i '332,371c\
        {/* Floating Action Button */}\
        {page !== "onboarding" && (\
          <button\
            onClick={() => openAddTx()}\
            aria-label="Nova transação"\
            className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all hover:bg-primary/95 z-40"\
          >\
            <Plus size={24} className="text-primary-foreground" strokeWidth={2.5} />\
          </button>\
        )}\
        <nav className="shrink-0 flex items-center justify-around border-t border-border bg-background px-2 pb-4 pt-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-50">\
          {navItems.map((item) => {\
            const active = page === item.id;\
            const Icon = item.icon;\
            return (\
              <button\
                key={item.id}\
                onClick={() => setPage(item.id)}\
                aria-label={item.label}\
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}\
              >\
                {active && (\
                  <motion.span\
                    layoutId="nav-pill"\
                    className="absolute inset-0 rounded-xl bg-muted"\
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}\
                  />\
                )}\
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className="relative" />\
                <span className="text-[10px] font-semibold tracking-wide relative">{item.label}</span>\
              </button>\
            );\
          })}\
        </nav>' src/app/App.tsx
