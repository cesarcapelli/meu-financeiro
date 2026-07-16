const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/OnboardingPage.tsx', 'utf-8');

code = code.replace(
`  const handleAddExpense = () => {
    const newId = \`exp-custom-\${Date.now()}\`;
    setExpenses([
      ...expenses,
      {
        id: newId,
        name: "",
        value: 0,
        dueDay: 10,
        splitEnabled: false,
        splitType: "50-50",
        splitPercentage: 50,
        splitWith: "",
      },
    ]);
  };`,
`  const handleAddExpense = () => {
    const newId = \`exp-custom-\${Date.now()}-\${Math.random()}\`;
    setExpenses([
      ...expenses,
      {
        id: newId,
        name: "",
        value: 0,
        dueDay: 10,
        splitEnabled: false,
        splitType: "50-50",
        splitPercentage: 50,
        splitWith: "",
      },
    ]);
    setTimeout(() => {
      const container = document.getElementById('expenses-list-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };`
);

code = code.replace(
`                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">`,
`                <div id="expenses-list-container" className="space-y-4 max-h-[380px] overflow-y-auto pr-1">`
);

code = code.replace(
`                  <button
                    onClick={handleAddExpense}
                    className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md transition-all cursor-pointer"
                  >`,
`                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md transition-all cursor-pointer z-10"
                  >`
);

fs.writeFileSync('src/app/components/pages/OnboardingPage.tsx', code);
