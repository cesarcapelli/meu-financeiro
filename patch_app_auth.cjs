const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const userDoc = await getDoc(doc(db, "users", fUser.uid));
            const homeId = userDoc.exists() ? userDoc.data().homeId : undefined;
            const initials = (fUser.displayName || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            
            setUser({
              uid: fUser.uid,
              name: fUser.displayName || "Usuário",
              email: fUser.email || "",
              initials,
              provider: "google",
              homeId
            });
          } catch (e) {
            console.error("Error loading user data", e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setReady(true);
      });
      return unsubscribe;
    });
  }, []);`,
`  useEffect(() => {
    let unsubUserDoc = () => {};
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          try {
            const { doc, onSnapshot } = await import("firebase/firestore");
            unsubUserDoc = onSnapshot(doc(db, "users", fUser.uid), (userDoc) => {
              const homeId = userDoc.exists() ? userDoc.data().homeId : undefined;
              const initials = (fUser.displayName || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              
              setUser({
                uid: fUser.uid,
                name: fUser.displayName || "Usuário",
                email: fUser.email || "",
                initials,
                provider: "google",
                homeId
              });
              setReady(true);
            });
          } catch (e) {
            console.error("Error loading user data", e);
            setUser(null);
            setReady(true);
          }
        } else {
          unsubUserDoc();
          setUser(null);
          setReady(true);
        }
      });
    });
    return () => unsubUserDoc();
  }, []);`
);

fs.writeFileSync('src/app/App.tsx', code);
