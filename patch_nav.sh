sed -i 's/type Page = "dashboard" | "carteira" | "onboarding";/type Page = "dashboard" | "casa" | "carteira" | "onboarding";/g' src/app/App.tsx
sed -i 's/{ id: "carteira", label: "Carteira", icon: Wallet },/{ id: "casa", label: "Casa", icon: Home },\n    { id: "carteira", label: "Carteira", icon: Wallet },/g' src/app/App.tsx
