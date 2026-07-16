sed -i 's/import { TransacoesPage } from ".\/components\/pages\/TransacoesPage";/import { CarteiraPage } from ".\/components\/pages\/CarteiraPage";/g' src/app/App.tsx
sed -i '/import { OrcamentoPage }/d' src/app/App.tsx
sed -i '/import { CartoesPage }/d' src/app/App.tsx
