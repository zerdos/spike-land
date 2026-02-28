# @spike-land-ai/eslint-config

Shared ESLint flat configuration for `@spike-land-ai` packages. This package provides consistent linting rules and standards across the monorepo, ensuring high code quality and style consistency.

## Features

- Shared ESLint flat configurations for TypeScript and React.
- Easy integration into any `@spike-land-ai` package.
- Consistent linting rules and style across the project.

## Installation

```bash
yarn add -D @spike-land-ai/eslint-config
```

## Usage

In your package's `eslint.config.mjs` or `eslint.config.js`:

```javascript
import spikeConfig from "@spike-land-ai/eslint-config";

export default [
  ...spikeConfig,
  // Your custom rules here
];
```

For React projects:

```javascript
import spikeConfig from "@spike-land-ai/eslint-config/react";

export default [
  ...spikeConfig,
  // Your custom rules here
];
```
