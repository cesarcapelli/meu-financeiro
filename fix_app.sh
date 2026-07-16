sed -i 's/type Page = "dashboard" | "transacoes" | "orcamento" | "metas" | "cartoes" | "onboarding";/type Page = "dashboard" | "carteira" | "onboarding";/g' src/app/App.tsx
sed -i 's/{ id: "transacoes", label: "Transações", icon: ArrowRightLeft },/{ id: "carteira", label: "Carteira", icon: Wallet },/g' src/app/App.tsx
sed -i '/{ id: "cartoes", label: "Cartões", icon: CreditCard },/d' src/app/App.tsx
sed -i '/{ id: "orcamento", label: "Orçamento", icon: Wallet },/d' src/app/App.tsx
