const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/OnboardingPage.tsx', 'utf-8');

code = code.replace(
`  const [salario, setSalario] = useState<number>(7500);`,
`  const [salario, setSalario] = useState<number>(0);`
);

code = code.replace(
`  const [va, setVa] = useState<number>(650);`,
`  const [va, setVa] = useState<number>(0);`
);

code = code.replace(
`  const [vr, setVr] = useState<number>(850);`,
`  const [vr, setVr] = useState<number>(0);`
);

fs.writeFileSync('src/app/components/pages/OnboardingPage.tsx', code);
