const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/OnboardingPage.tsx', 'utf-8');

code = code.replace(
`  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: "exp-1",
      name: "Financiamento da Casa",
      value: 3200,
      dueDay: 10,
      splitEnabled: true,
      splitType: "50-50",
      splitPercentage: 50,
      splitWith: "Aline",
    },
    {
      id: "exp-2",
      name: "Energia Elétrica",
      value: 350,
      dueDay: 15,
      splitEnabled: true,
      splitType: "50-50",
      splitPercentage: 50,
      splitWith: "Aline",
    },
    {
      id: "exp-3",
      name: "Plano de Saúde",
      value: 800,
      dueDay: 20,
      splitEnabled: false,
      splitType: "50-50",
      splitPercentage: 50,
      splitWith: "",
    },
  ]);`,
`  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: "exp-1", name: "Moradia (Aluguel/Financiamento)", value: 0, dueDay: 5, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-2", name: "Condomínio", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-3", name: "Energia Elétrica", value: 0, dueDay: 15, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-4", name: "Água", value: 0, dueDay: 15, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-5", name: "Internet / Celular", value: 0, dueDay: 10, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
    { id: "exp-6", name: "Supermercado", value: 0, dueDay: 20, splitEnabled: false, splitType: "50-50", splitPercentage: 50, splitWith: "" },
  ]);`
);

code = code.replace(
`                if (step === 2) {
                  const emptyExp = expenses.some((e) => !e.name.trim() || e.value <= 0);
                  if (emptyExp) {
                    toast.error("Por favor, preencha o nome e valor das contas cadastradas ou remova-as.");
                    return;
                  }
                }`,
`                if (step === 2) {
                  const emptyExp = expenses.some((e) => !e.name.trim());
                  if (emptyExp) {
                    toast.error("Por favor, preencha o nome de todas as contas ou remova as que estão em branco.");
                    return;
                  }
                }`
);

fs.writeFileSync('src/app/components/pages/OnboardingPage.tsx', code);
