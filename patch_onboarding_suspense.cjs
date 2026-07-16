const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf-8');

code = code.replace(
`  if (page === "onboarding") {
    return (
      <OnboardingPage
        onComplete={() => setPage("dashboard")}
        onBackToDashboard={() => setPage("dashboard")}
      />
    );
  }`,
`  if (page === "onboarding") {
    return (
      <Suspense fallback={<div className="size-full bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>}>
        <OnboardingPage
          onComplete={() => setPage("dashboard")}
          onBackToDashboard={() => setPage("dashboard")}
        />
      </Suspense>
    );
  }`
);

fs.writeFileSync('src/app/App.tsx', code);
