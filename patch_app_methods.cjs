const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`  const login = (u: AuthUser) => {
    setUser(u);
    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    toast.success(\`Bem-vinda, \${u.name.split(" ")[0]}!\`);
  };`,
`  const login = (u: AuthUser) => {
    setUser(u);
    toast.success(\`Bem-vinda, \${u.name.split(" ")[0]}!\`);
  };`
);

code = code.replace(
`  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(AUTH_KEY);
      signOut(auth).catch((err) => console.error("Error signing out from Firebase:", err));
    } catch {
      /* ignore */
    }
  };`,
`  const logout = () => {
    try {
      signOut(auth).then(() => setUser(null)).catch((err) => console.error("Error signing out from Firebase:", err));
    } catch {
      /* ignore */
    }
  };`
);

fs.writeFileSync('src/app/App.tsx', code);
