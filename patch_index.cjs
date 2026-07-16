const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf-8');

code = code.replace(
`      <meta name="robots" content="noindex, nofollow" />`,
`      <meta name="robots" content="noindex, nofollow" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#2563EB" />
      <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      <link rel="apple-touch-icon" href="/icon.svg" />`
);

fs.writeFileSync('index.html', code);
