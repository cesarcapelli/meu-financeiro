const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`<span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
                    {user.initials}
                  </span>`,
`{user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-border" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
                      {user.initials}
                    </span>
                  )}`
);

code = code.replace(
`              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Conta"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground"
              >
                {user.initials}
              </button>`,
`              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Conta"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.initials
                )}
              </button>`
);

code = code.replace(
`          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
            {user.initials}
          </div>`,
`          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden border border-border">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.initials
            )}
          </div>`
);

fs.writeFileSync('src/app/App.tsx', code);
