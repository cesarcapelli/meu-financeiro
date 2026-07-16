const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

code += `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
`;

fs.writeFileSync('src/main.tsx', code);
