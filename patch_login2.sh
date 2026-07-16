sed -i '/const user: AuthUser = {/i \      const userDoc = await getDoc(doc(db, "users", fUser.uid));\n      const homeId = userDoc.exists() ? userDoc.data().homeId : undefined;' src/app/components/pages/LoginPage.tsx
sed -i '/provider: "google",/a \        homeId,' src/app/components/pages/LoginPage.tsx
