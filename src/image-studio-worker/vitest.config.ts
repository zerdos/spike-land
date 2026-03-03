import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "image-studio-worker",
      environment: "node",
      include: ["*.test.ts"],
      exclude: ["node_modules", "frontend"],
      coverage: {
        exclude: [
          "*.test.ts",
          "frontend/**",
          "vitest.config.ts",
          "deps/nanoid.ts",
          "migrations/**",
        ],
      },
    },
  }),
);
