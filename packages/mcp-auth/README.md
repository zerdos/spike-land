# @spike-land-ai/mcp-auth

Auth Model Context Protocol (MCP) server for `spike.land`. This dedicated microservice handles authentication and authorization, providing a secure and scalable way for AI agents to interact with the platform.

## Features

- Model Context Protocol (MCP) interface for authentication.
- Backed by Cloudflare D1 and R2 for reliable storage.
- Seamlessly integrates with `spike.land`.

## Installation

```bash
yarn install
```

## Build/Deploy

```bash
yarn deploy
```

## Usage

### Development

```bash
yarn dev
```

### Database Management

```bash
yarn db:generate
yarn db:push
yarn db:studio
```
