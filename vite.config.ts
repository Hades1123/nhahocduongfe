import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import dotenv from "dotenv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envFiles: Record<string, string> = {
    development: "enviroments/.env.development",
    production: "enviroments/.env.production",
  };

  dotenv.config({ path: envFiles[mode] });

  // Bridge: truyền VITE_* từ process.env (dotenv) → import.meta.env (client)
  const clientEnv: Record<string, string> = {};
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("VITE_")) {
      clientEnv[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
  }

  return {
    define: clientEnv,
    plugins: [react()],
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8081",
          changeOrigin: true,
        },
      },
    },
  };
});
