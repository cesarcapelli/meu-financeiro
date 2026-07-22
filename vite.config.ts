import { defineConfig, Plugin } from "vite"
import path from 'path';
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { parseExpensesWithGemini } from "./src/server/gemini";

function apiMiddleware(): Plugin {
  return {
    name: "api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/parse-expenses" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const { prompt, houseName } = JSON.parse(body || "{}");
              if (!prompt) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Prompt é obrigatório" }));
                return;
              }

              const jsonResult = await parseExpensesWithGemini(prompt, houseName);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(jsonResult);
            } catch (err: any) {
              console.error("Erro na rota /api/parse-expenses:", err?.message || err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err?.message || "Erro interno ao processar IA" }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    apiMiddleware(), figmaAssetResolver(), react(), tailwindcss()
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
});

