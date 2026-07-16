const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`              {/* Left Column: Month Selection & User identity */}
              <div className="flex flex-col gap-2">
                {/* Month Selector: Inline control above the profile header */}
                <div className="relative flex items-center w-fit bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all rounded-md px-2 py-0.5">
                  <select
                    value={state.currentMonth}
                    onChange={(e) => dispatch({ type: "SET_MONTH", month: e.target.value })}
                    className="appearance-none bg-transparent rounded border-0 outline-none text-[10px] font-semibold text-muted-foreground hover:text-foreground pr-3.5 py-0 pl-0 cursor-pointer focus:ring-0 active:scale-[0.98] transition-all"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-card text-foreground">
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60">
                    <ChevronDown size={8} />
                  </div>
                </div>

                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Conta"
                  className="flex items-center gap-2.5 active:scale-[0.98] transition-transform text-left"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-border" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
                      {user.initials}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-foreground tracking-tight">
                    Olá, {user.name.split(" ")[0]}
                  </span>
                </button>
              </div>`,
`              {/* Left Column: User identity & Month Selection */}
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Conta"
                  className="flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-border" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">
                      {user.initials}
                    </span>
                  )}
                  <span className="text-base font-bold text-foreground tracking-tight">
                    Olá, {user.name.split(" ")[0]}
                  </span>
                </button>

                {/* Month Selector: Inline control below the profile header */}
                <div className="relative flex items-center w-fit bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all rounded-md px-2 py-0.5 ml-1">
                  <select
                    value={state.currentMonth}
                    onChange={(e) => dispatch({ type: "SET_MONTH", month: e.target.value })}
                    className="appearance-none bg-transparent rounded border-0 outline-none text-[11px] font-semibold text-muted-foreground hover:text-foreground pr-4 py-0 pl-0 cursor-pointer focus:ring-0 active:scale-[0.98] transition-all"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-card text-foreground">
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60">
                    <ChevronDown size={10} />
                  </div>
                </div>
              </div>`
);

fs.writeFileSync('src/app/App.tsx', code);
