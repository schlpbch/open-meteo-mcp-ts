# Migration Guide: Deno → Node.js

**Target Runtime**: Node.js 20 LTS+
**Estimated Completion**: 2026-02-11
**Current Status**: Planning Phase

---

## Overview

This guide documents the migration from Deno to Node.js for the Open-Meteo MCP TypeScript project. The migration maintains full feature parity while leveraging Node.js's broader ecosystem and enterprise acceptance.

## Rationale for Migration

- **Ecosystem**: Access to npm's 2+ million packages
- **Adoption**: Broader team and enterprise acceptance
- **Support**: Mature tooling and third-party integrations
- **Resources**: Larger community and documentation base

## Migration Phases

### Phase 1: Setup & Build Configuration (Day 1-2)

#### 1.1 Create package.json

```json
{
  "name": "@schlp/open-meteo-mcp-ts",
  "version": "4.0.0",
  "description": "Open-Meteo MCP Server for Claude",
  "type": "module",
  "main": "dist/main.js",
  "bin": {
    "open-meteo-mcp": "dist/main.js"
  },
  "scripts": {
    "start": "node dist/main.js",
    "dev": "node --watch --loader tsx src/main.ts",
    "build": "tsc",
    "test": "node --loader tsx --test tests/**/*.test.ts",
    "test:watch": "node --watch --loader tsx --test tests/**/*.test.ts",
    "coverage": "node --loader tsx --test --coverage tests/**/*.test.ts",
    "lint": "eslint src tests --max-warnings 0",
    "fmt": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "fmt:check": "prettier --check 'src/**/*.ts' 'tests/**/*.ts'",
    "check": "tsc --noEmit"
  },
  "keywords": ["mcp", "weather", "open-meteo", "claude"],
  "author": "Open Meteo Contributors",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.24.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "prettier": "^3.1.0"
  }
}
```

#### 1.2 Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage", "tests"]
}
```

#### 1.3 Update main.ts with Node.js Entry Point

**Before (Deno)**:
```typescript
#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
```

**After (Node.js)**:
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import process from "process";
```

**Key Changes**:
- Replace Deno shebang with Node.js shebang
- Import `process` from Node.js (for process.exit, process.env, etc.)
- Remove Deno-specific error handling if needed

#### 1.4 Update .gitignore

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Coverage
coverage/
*.lcov

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local
```

---

### Phase 2: File Structure Changes (Day 2-3)

#### 2.1 Create source structure

```
open-meteo-mcp-ts/
├── src/
│   ├── main.ts          # Entry point (updated)
│   ├── server.ts        # MCP handlers (no changes)
│   ├── client.ts        # API client (minor updates)
│   ├── models.ts        # Zod schemas (no changes)
│   ├── helpers.ts       # Utilities (no changes)
│   └── data/            # JSON resources (no changes)
│
├── tests/
│   ├── main_test.ts     # Test entry point
│   ├── client_test.ts   # Client tests
│   ├── server_test.ts   # MCP tests
│   ├── helpers_test.ts  # Helper tests
│   ├── models_test.ts   # Schema tests
│   ├── air_quality_test.ts
│   └── geocoding_test.ts
│
├── dist/                # Compiled output (generated)
├── coverage/            # Test coverage (generated)
│
├── package.json         # NEW
├── tsconfig.json        # NEW
├── .eslintrc.json       # NEW
├── .prettierrc.json     # NEW
├── deno.json            # REMOVE
├── deno.lock            # REMOVE
└── README.md            # Update
```

#### 2.2 Remove Deno-specific files

```bash
rm deno.json deno.lock
```

---

### Phase 3: Update Dependencies & API Usage (Day 3-4)

#### 3.1 Update src/client.ts - HTTP Requests

**Deno uses global fetch, Node.js needs explicit import:**

```typescript
// Node.js compatible version
import { type WeatherResponse } from "./models.ts";

export class WeatherClient {
  async getWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", latitude.toString());
    url.searchParams.set("longitude", longitude.toString());

    const response = await fetch(url.toString(), {
      headers: { "Accept-Encoding": "gzip" },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return WeatherResponseSchema.parse(data);
  }

  // ... rest of methods unchanged
}
```

**Note**: Fetch API is built-in to Node.js 18+ (no changes needed)

#### 3.2 Update main.ts - Process Handling

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import process from "process";
import { listTools, handleToolCall } from "./server.ts";

async function main() {
  const server = new Server(
    {
      name: "open-meteo-mcp",
      version: "4.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register handlers (unchanged)
  server.setRequestHandler(ListToolsRequestSchema, listTools);
  // ... register all handlers

  // Create transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (unchanged)
  console.error("Open-Meteo MCP Server running on stdio");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
```

**Key Differences**:
- Use `process.argv[1]` instead of Deno pattern
- Import `process` module
- Use `process.exit()` instead of `Deno.exit()`

#### 3.3 Update tests - Testing Framework

**Migrate from Deno.test to Node.js test runner:**

```typescript
// Old (Deno style)
import { assertEquals } from "@std/assert/mod.ts";
Deno.test("test name", () => {
  assertEquals(actual, expected);
});

// New (Node.js style)
import { test, describe } from "node:test";
import { strict as assert } from "assert";

describe("Helper Functions", () => {
  test("formatTemperature with valid input", () => {
    assert.equal(formatTemperature(20.5), "20.5°C");
  });
});
```

**Mapping Deno → Node.js assertions:**

| Deno | Node.js |
|---|---|
|assertEquals|assert.equal|
|assertExists|assert.ok|
|assertThrows|assert.throws|
|assertRejects|assert.rejects|
|assertStringIncludes|assert.match|

#### 3.4 Remove deno.json configuration

All configuration moves to:
- `tsconfig.json` - TypeScript
- `package.json` - Node.js
- `.eslintrc.json` - Linting
- `.prettierrc.json` - Formatting

---

### Phase 4: Testing & Validation (Day 4-5)

#### 4.1 Install dependencies

```bash
npm install
```

#### 4.2 Type checking

```bash
npm run check
```

#### 4.3 Run tests

```bash
npm test
```

#### 4.4 Build output

```bash
npm run build
```

#### 4.5 Verify binary execution

```bash
chmod +x dist/main.js
./dist/main.js
```

---

### Phase 5: Deployment & Documentation (Day 5-6)

#### 5.1 Update docker-compose.yml (if applicable)

```yaml
services:
  open-meteo:
    build:
      context: .
      dockerfile: Dockerfile.nodejs
    environment:
      NODE_ENV: production
    ports:
      - "8888:8888"
```

#### 5.2 Create Dockerfile.nodejs

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY dist ./dist

# Add shebang execution
RUN chmod +x dist/main.js

# Run application
CMD ["node", "dist/main.js"]
```

#### 5.3 Update GitHub Actions workflow

```yaml
name: Test & Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm pack
      # Deploy to npm registry or other target
```

#### 5.4 Update documentation

- README.md: Update installation/setup instructions
- CLAUDE.md: Update runtime information
- DEPLOYMENT.md: Update deployment procedures

---

### Phase 6: Cleanup & Finalization (Day 6-7)

#### 6.1 Remove Deno-specific code

```bash
rm -f deno.json deno.lock main_test.ts
```

#### 6.2 Update package.json version

Bump to reflect migration:
```json
{
  "version": "4.0.1"
}
```

#### 6.3 Create migration commit

```bash
git add -A
git commit -m "chore: migrate from Deno to Node.js

- Replace Deno with Node.js 20 LTS runtime
- Update build system: tsc instead of esbuild
- Migrate tests to Node.js test runner
- Update documentation and deployment configs
- Improve ecosystem compatibility and adoption

BREAKING CHANGE: Deno runtime no longer supported
Closes: #migration-to-nodejs"
```

#### 6.4 Tag release

```bash
git tag -a v4.1.0 -m "Migration to Node.js complete"
git push origin main v4.1.0
```

---

## Compatibility Matrix

### Before & After

|Component|Deno|Node.js|Status|
|---|---|---|---|
|Shebang|`#!/usr/bin/env -S deno run ...`|`#!/usr/bin/env node`|✅|
|Imports|JSR/npm imports|npm only|✅|
|Testing|deno test|node test|✅|
|HTTP|Built-in fetch|Built-in fetch|✅|
|Logging|console.error|console.error|✅|
|Async|Promise/async|Promise/async|✅|
|TypeScript|Native|tsx loader|✅|
|Permissions|Explicit flags|Implicit|⚠️|

---

## Rollback Plan

If issues arise, rollback to Deno:

```bash
# Restore deno files from git
git checkout HEAD~1 deno.json deno.lock deno.jsonc

# Remove Node.js files
rm -f package*.json tsconfig.json dist/

# Use Deno again
deno task start
```

---

## Testing Checklist

- [ ] TypeScript compilation succeeds
- [ ] All unit tests pass
- [ ] Coverage meets 80%+ target
- [ ] MCP Inspector shows all tools/resources/prompts
- [ ] API calls work (mocked tests)
- [ ] Binary executes correctly
- [ ] Docker image builds
- [ ] GitHub Actions workflow passes
- [ ] No security warnings

---

## Performance Benchmarks

**Target metrics** (validate post-migration):

- Cold start: ≤200ms
- Response time P95: ≤125ms
- Memory usage: ≤100MB
- Test execution: <5 seconds

---

## Known Issues & Mitigations

### Issue 1: Lost Deno Features
- **Problem**: No explicit permission model
- **Mitigation**: Document best practices in CLAUDE.md
- **Status**: Acceptable tradeoff for ecosystem access

### Issue 2: Larger Container Image
- **Problem**: Node.js images larger than Deno
- **Mitigation**: Use alpine base image
- **Size**: ~180MB (vs ~150MB Deno)

### Issue 3: npm vs Deno package management
- **Problem**: node_modules bloat
- **Mitigation**: Use npm ci for consistent installs, prune before deploy
- **Status**: Industry standard practice

---

## Success Criteria

✅ All criteria must be met:

1. All tests pass with 80%+ coverage
2. Zero TypeScript errors
3. MCP protocol fully functional
4. Binary executes standalone
5. Docker image builds and runs
6. GitHub Actions pipeline succeeds
7. Documentation updated
8. Performance benchmarks met

---

## Timeline

| Phase | Task | Duration | Owner |
|---|---|---|---|
| 1 | Setup & Config | 2 days | @dev |
| 2 | File Structure | 1 day | @dev |
| 3 | Dependencies | 1 day | @dev |
| 4 | Testing | 2 days | @qa |
| 5 | Deployment | 1 day | @devops |
| 6 | Cleanup | 1 day | @dev |
| **Total** | | **7 days** | |

---

## References

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [npm Documentation](https://docs.npmjs.com/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

---

**Status**: ✅ Migration guide complete and ready for execution
**Next Step**: Begin Phase 1 implementation
**Questions**: See [ADR-001: Use Node.js as Runtime](./ADR_COMPENDIUM.md#adr-001-use-nodejs-as-the-runtime-environment)
