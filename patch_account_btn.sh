sed -i '/<div className="flex flex-col gap-3">/a \
          {user.homeId && (\
            <button\
              onClick={() => {\
                setMenuOpen(false);\
                setShowHomeSettings(true);\
              }}\
              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-transform cursor-pointer"\
            >\
              <Settings size={15} /> Configurações da Casa\
            </button>\
          )}' src/app/App.tsx
