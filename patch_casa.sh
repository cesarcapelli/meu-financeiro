sed -i '/import { CarteiraPage }/a \import { CasaPage } from ".\/components\/pages\/CasaPage";' src/app/App.tsx
sed -i '/{page === "carteira" && (/i \              {page === "casa" && <CasaPage onOpenSettings={() => setShowHomeSettings(true)} />}' src/app/App.tsx
