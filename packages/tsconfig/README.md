# @spike-land-ai/tsconfig

Shared TypeScript configuration presets for `@spike-land-ai` packages. This package provides common `tsconfig.json` bases for various environments (base, MCP, worker, bundler), ensuring consistent compilation settings.

## Features

- Shared TypeScript configurations for different environments.
- Easy inheritance in any `@spike-land-ai` package.
- Consistent compiler options and type checking across the project.

## Installation

```bash
yarn add -D @spike-land-ai/tsconfig
```

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@spike-land-ai/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Other presets available:
- `@spike-land-ai/tsconfig/tsconfig.mcp.json`
- `@spike-land-ai/tsconfig/tsconfig.worker.json`
- `@spike-land-ai/tsconfig/tsconfig.bundler.json`
