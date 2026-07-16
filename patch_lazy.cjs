const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`import { DashboardPage } from "./components/pages/DashboardPage";
import { CarteiraPage } from "./components/pages/CarteiraPage";
import { CasaPage } from "./components/pages/CasaPage";
import { OnboardingPage } from "./components/pages/OnboardingPage";`,
`import { lazy, Suspense } from "react";
const DashboardPage = lazy(() => import("./components/pages/DashboardPage").then(module => ({ default: module.DashboardPage })));
const CarteiraPage = lazy(() => import("./components/pages/CarteiraPage").then(module => ({ default: module.CarteiraPage })));
const CasaPage = lazy(() => import("./components/pages/CasaPage").then(module => ({ default: module.CasaPage })));
const OnboardingPage = lazy(() => import("./components/pages/OnboardingPage").then(module => ({ default: module.OnboardingPage })));`
);

fs.writeFileSync('src/app/App.tsx', code);
