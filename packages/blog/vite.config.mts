import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  environments: {
    worker: {
      resolve: {
        alias: {
          "@": new URL("./src", import.meta.url).pathname,
        },
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "worker" } }),
    redwood(),
  ],
});
