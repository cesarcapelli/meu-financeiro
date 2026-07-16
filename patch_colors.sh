sed -i 's/t.value < 0 ? "text-foreground" : "text-muted-foreground"/t.value < 0 ? "text-destructive" : "text-muted-foreground"/g' src/app/components/pages/CarteiraPage.tsx
sed -i 's/span className="text-sm font-bold text-foreground"/span className={`text-sm font-bold ${t.value < 0 ? "text-destructive" : "text-muted-foreground"}`}/g' src/app/components/pages/CarteiraPage.tsx
