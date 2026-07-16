const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/OnboardingPage.tsx', 'utf-8');

// Add state
code = code.replace(
`  // STEP 1 State: Receitas e Benefícios
  const [salario, setSalario] = useState<number>(7500);
  const [salarioDia, setSalarioDia] = useState<number>(5);`,
`  // STEP 1 State: Receitas e Benefícios
  const [salario, setSalario] = useState<number>(7500);
  const [salarioDia, setSalarioDia] = useState<number>(5);
  const [vale, setVale] = useState<number>(0);
  const [valeDia, setValeDia] = useState<number>(20);`
);

// Add to generateJSONSchema
code = code.replace(
`      income: {
        salary: salario,
        salary_day: salarioDia,
        benefits: {`,
`      income: {
        salary: salario,
        salary_day: salarioDia,
        salary_advance: vale > 0 ? { amount: vale, day: valeDia } : null,
        benefits: {`
);

// Add to handleFinalize insertion
code = code.replace(
`    // Add Salary (income)
    if (salario > 0) {
      txsToInsert.push({
        id: \`tx-salary-\${Date.now()}\`,
        desc: "Salário Líquido (Onboarding)",
        cat: "Renda",
        month: currentMonthLabel,
        date: \`\${String(salarioDia).padStart(2, "0")} \${currentMonthLabel}\`,
        value: salario,
        type: "in",
        bucket: "variavel", // income doesn't strictly follow fixed/variable bucket rules
      });
    }`,
`    // Add Salary (income)
    if (salario > 0) {
      txsToInsert.push({
        id: \`tx-salary-\${Date.now()}\`,
        desc: "Salário Líquido / Pagamento",
        cat: "Renda",
        month: currentMonthLabel,
        date: \`\${String(salarioDia).padStart(2, "0")} \${currentMonthLabel}\`,
        value: salario,
        type: "in",
        bucket: "variavel",
      });
    }

    // Add Vale (advance)
    if (vale > 0) {
      txsToInsert.push({
        id: \`tx-vale-\${Date.now()}\`,
        desc: "Adiantamento (Vale)",
        cat: "Renda",
        month: currentMonthLabel,
        date: \`\${String(valeDia).padStart(2, "0")} \${currentMonthLabel}\`,
        value: vale,
        type: "in",
        bucket: "variavel",
      });
    }`
);

// Update step 3 total
code = code.replace(
`                    <span className="text-sm font-extrabold text-green-500 mt-1">{money(salario + va + vr)}</span>`,
`                    <span className="text-sm font-extrabold text-green-500 mt-1">{money(salario + vale + va + vr)}</span>`
);

// Add to UI
code = code.replace(
`                {/* Vale Alimentação (VA) */}`,
`                {/* Adiantamento (Vale) */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <DollarSign size={13} />
                    </span>
                    <label className="text-xs font-bold text-foreground">Adiantamento (Vale) <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={vale || ""}
                        onChange={(e) => setVale(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all font-semibold"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-2 px-1 text-[8px] font-bold text-muted-foreground bg-card">Dia de Recebimento</label>
                      <select
                        value={valeDia}
                        onChange={(e) => setValeDia(Number(e.target.value))}
                        className="w-full bg-background/50 border border-border/40 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card">Dia {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vale Alimentação (VA) */}`
);

fs.writeFileSync('src/app/components/pages/OnboardingPage.tsx', code);
