import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY || "";
  const ollamaHost = env.OLLAMA_HOST || "http://127.0.0.1:11434";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/ollama": {
          target: ollamaHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ollama/, ""),
        },
        "/api/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (apiKey) {
                proxyReq.setHeader("x-api-key", apiKey);
                proxyReq.setHeader("anthropic-version", "2023-06-01");
              }
            });
          },
        },
      },
    },
  };
});
