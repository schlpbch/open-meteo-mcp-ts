# Claude Context: Open-Meteo MCP TypeScript

This document provides context for AI assistants (like Claude) working with this codebase.

## Project Overview

**Open-Meteo MCP TypeScript** is a Model Context Protocol (MCP) server that provides weather data from Open-Meteo to AI assistants. It's a complete TypeScript/Deno rewrite of the original Python implementation.

### Key Facts

- **Runtime**: Deno 1.40+
- **Protocol**: Model Context Protocol (MCP)
- **API**: Open-Meteo (free, no API key required)
- **Language**: TypeScript with strict type checking
- **Testing**: 144 tests, all passing
- **Deployment**: Deno Deploy via GitHub Actions

## Architecture

### MCP Components

The server implements three core MCP primitives:

1. **Tools** (11 total): Weather, air quality, snow conditions, location search, etc.
2. **Resources** (4 total): Static data like WMO codes, API parameters, AQI reference
3. **Prompts** (3 total): Pre-configured workflows for ski trips, outdoor activities, travel

### Core Files

```
src/
├── main.ts       # Entry point - initializes MCP server with stdio transport
├── server.ts     # MCP handlers (tools, resources, prompts)
├── client.ts     # Open-Meteo API client with HTTP compression
├── models.ts     # Zod schemas and TypeScript types
├── helpers.ts    # Utility functions (formatting, calculations, data processing)
└── data/         # JSON resources (WMO codes, Swiss locations, etc.)
```

### Data Flow

1. **Client request** → MCP protocol via stdio
2. **Server routes** → `server.ts` handles tool/resource/prompt requests
3. **API client** → `client.ts` fetches data from Open-Meteo
4. **Validation** → Zod schemas in `models.ts` validate responses
5. **Formatting** → `helpers.ts` formats data for user consumption
6. **Response** → Returns via MCP protocol

## File Responsibilities

### [src/main.ts](src/main.ts)

- Entry point with shebang for Deno
- Creates MCP server instance
- Registers request handlers
- Sets up stdio transport
- Error handling and logging

**Key patterns:**
- Uses `import.meta.main` for module detection
- Logs to stderr (stdout reserved for MCP protocol)
- Graceful error handling with process exit codes

### [src/server.ts](src/server.ts)

- Implements all MCP request handlers
- 11 tool implementations
- 4 resource handlers
- 3 prompt templates
- Input validation and error handling

**Important:**
- All tools use Zod schema validation
- Tools return structured content arrays
- Resources are read from `src/data/` JSON files
- Prompts include arguments for customization

### [src/client.ts](src/client.ts)

- Open-Meteo API client class
- HTTP requests with gzip compression
- Response validation
- Error handling with meaningful messages

**API methods:**
- `searchLocation()`: Geocoding with fuzzy search
- `getWeather()`: Current + forecast weather
- `getAirQuality()`: AQI, pollutants, pollen
- `getSnowConditions()`: Snow depth, snowfall
- `getMarineConditions()`: Ocean weather, waves
- `getHistoricalWeather()`: Past weather data

**Performance:**
- Gzip compression enabled
- Connection reuse
- Timeout handling
- Response size limits

### [src/models.ts](src/models.ts)

- Zod schemas for all API responses
- TypeScript type inference from schemas
- Input validation schemas for tool arguments
- Comprehensive type safety

**Pattern:**
```typescript
// Define schema
export const WeatherResponseSchema = z.object({ ... });

// Infer type
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
```

### [src/helpers.ts](src/helpers.ts)

- Formatting functions (dates, coordinates, units)
- Weather code interpretation (WMO codes)
- Danger level calculations
- Data transformations
- Swiss location utilities

**Key functions:**
- `formatTemperature()`: Celsius with symbol
- `formatCoordinate()`: Lat/lon with directions
- `getWeatherDescription()`: WMO code → human text
- `calculateDangerLevel()`: Weather severity assessment
- `formatDateTime()`: Timezone-aware formatting

## Development Workflow

### Common Tasks

**Run tests:**
```bash
deno task test              # Run all tests
deno task test:watch        # Watch mode
deno task coverage          # Generate coverage
```

**Development:**
```bash
deno task dev               # Hot reload
deno task start             # Production mode
```

**Code quality:**
```bash
deno task lint              # Lint code
deno task fmt               # Format code
deno task check             # Type check
```

**Testing with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector deno run --allow-net --allow-read --allow-env src/main.ts
```

### Making Changes

#### Adding a New Tool

1. **Define schema** in [src/models.ts](src/models.ts):
   ```typescript
   export const MyToolArgsSchema = z.object({
     param: z.string(),
   });
   ```

2. **Add tool definition** in [src/server.ts](src/server.ts) `listTools()`:
   ```typescript
   {
     name: "meteo__my_tool",
     description: "Clear description",
     inputSchema: zodToJsonSchema(MyToolArgsSchema),
   }
   ```

3. **Implement handler** in [src/server.ts](src/server.ts) `handleToolCall()`:
   ```typescript
   case "meteo__my_tool": {
     const args = MyToolArgsSchema.parse(request.params.arguments);
     // Implementation
     return { content: [...] };
   }
   ```

4. **Add tests** in `tests/server_test.ts`

5. **Update documentation** in [README.md](README.md)

#### Adding a New Resource

1. Create JSON file in `src/data/my-resource.json`
2. Add resource definition in `listResources()`
3. Add read handler in `readResource()`
4. Add tests

#### Adding Helper Functions

1. Add function to [src/helpers.ts](src/helpers.ts)
2. Add comprehensive tests in `tests/helpers_test.ts`
3. Use consistent naming (verb + noun, e.g., `formatTemperature`)
4. Document complex logic with comments

## Code Conventions

### TypeScript Style

- **Strict mode enabled**: No implicit `any`, strict null checks
- **Prefer const**: Use `const` for immutability
- **Type inference**: Let TypeScript infer types when obvious
- **Explicit returns**: Always specify return types for public functions
- **Async/await**: Prefer over `.then()` chains

### Naming Conventions

- **Files**: lowercase with underscores (`helpers_test.ts`)
- **Variables**: camelCase (`currentWeather`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FORECAST_DAYS`)
- **Types**: PascalCase (`WeatherResponse`)
- **Functions**: camelCase with verb (`getWeather`, `formatDate`)

### Tool Naming

All tools follow the pattern: `meteo__<action>_<noun>`

Examples:
- `meteo__get_weather`
- `meteo__search_location`
- `meteo__get_comfort_index`

### Error Handling

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  throw new Error(`Descriptive message: ${error.message}`);
}
```

### Zod Validation

Always validate external data:
```typescript
const validated = MySchema.parse(data); // Throws on invalid
// Or
const result = MySchema.safeParse(data); // Returns { success, data, error }
```

## Testing Strategy

### Test Organization

- **tests/client_test.ts**: API client (mocked HTTP)
- **tests/server_test.ts**: MCP integration tests
- **tests/helpers_test.ts**: Utility functions (48 tests)
- **tests/models_test.ts**: Schema validation
- **tests/air_quality_test.ts**: Edge cases
- **tests/geocoding_test.ts**: Location search

### Test Patterns

**Unit tests:**
```typescript
Deno.test("formatTemperature() with valid input", () => {
  assertEquals(formatTemperature(20.5), "20.5°C");
});
```

**Async tests:**
```typescript
Deno.test("API call succeeds", async () => {
  const result = await client.getWeather(47.3769, 8.5417);
  assertExists(result.current_weather);
});
```

**Mock HTTP:**
```typescript
const mockFetch = (url: string) => {
  return Promise.resolve(new Response(JSON.stringify(mockData)));
};
```

### Coverage Goals

- **100%** for helper functions
- **90%+** for API client
- **85%+** for server handlers
- All edge cases documented in tests

## Deployment

### Deno Deploy Configuration

**Important**: The project must be in "GitHub Actions mode" on Deno Deploy.

1. Visit [dash.deno.com](https://dash.deno.com)
2. Create/configure project: `open-meteo-mcp-ts`
3. Ensure it's NOT in "automatic GitHub integration" mode
4. Set to accept `deployctl` deployments

### GitHub Actions Workflow

File: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

**Pipeline:**
1. **Test job**: Format, lint, type check, tests
2. **Deploy job**: Only runs on `main` branch pushes after tests pass

**Configuration:**
- Project: `open-meteo-mcp-ts`
- Entrypoint: `src/main.ts`
- Permissions: `id-token: write` (required for Deno Deploy)

### Local MCP Configuration

**Claude Desktop setup:**

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-env",
        "/absolute/path/to/open-meteo-mcp-ts/src/main.ts"
      ]
    }
  }
}
```

## Important Notes & Gotchas

### Permissions

Deno requires explicit permissions. Required flags:
- `--allow-net`: API calls to Open-Meteo
- `--allow-read`: Reading JSON resources from `src/data/`
- `--allow-env`: Environment variables (optional, for future config)

### Stdio Protocol

- **stdout**: Reserved for MCP protocol (binary data)
- **stderr**: Use for logging (`console.error()`)
- Never use `console.log()` in production code

### API Rate Limits

Open-Meteo is free but has limits:
- 10,000 requests/day per IP
- No authentication required
- Respect fair use policy

### Timezone Handling

All timestamps use IANA timezone identifiers:
- Switzerland: `Europe/Zurich`
- Auto-detection from location coordinates
- Use `date-fns-tz` for conversions

### Weather Codes

WMO weather codes (0-99) are industry standard:
- 0: Clear sky
- 1-3: Mainly clear to overcast
- 45-48: Fog
- 51-67: Precipitation
- 71-86: Snow
- 95-99: Thunderstorms

Reference: `src/data/wmo-codes.json`

### Swiss Locations

Pre-configured dataset includes:
- 100+ Swiss cities
- Mountain passes (Gotthard, Simplon, etc.)
- Ski resorts (Zermatt, St. Moritz, etc.)

Location: `src/data/swiss-locations.json`

### Type Safety

The codebase is **strictly typed**:
- No `any` types allowed
- All API responses validated with Zod
- Runtime type checking at boundaries
- Compile-time type inference

### Performance Targets

Based on benchmarks vs Python version:
- Response time: ≤125ms (P95)
- Memory usage: ≤70 MB
- Throughput: ≥280 RPS
- Cold start: ≤160ms

## Common Questions

### Q: How do I add a new weather parameter?

1. Check [Open-Meteo API docs](https://open-meteo.com/en/docs)
2. Add parameter to relevant schema in `models.ts`
3. Update API client method in `client.ts`
4. Add formatting helper in `helpers.ts` if needed
5. Update tests

### Q: How do I debug MCP communication?

Use MCP Inspector:
```bash
npx @modelcontextprotocol/inspector deno run --allow-net --allow-read --allow-env src/main.ts
```

### Q: How do I test against the real API?

Tests use mocked responses by default. For integration testing:
1. Create separate integration test file
2. Use real API calls (requires `--allow-net`)
3. Add retry logic and timeouts
4. Don't commit integration tests to CI (rate limits)

### Q: Why TypeScript instead of Python?

- Better type safety with compile-time checking
- Faster performance (Deno runtime)
- Native async/await without GIL limitations
- Better tree-shaking and bundling
- Modern tooling (Deno built-in formatter, linter, test runner)

## Related Projects

- **Swiss Mobility MCP**: `c:\Users\schlp\code\swiss-mobility-mcp` - Sister project for Swiss public transport
- **Original Python version**: [schlp/open-meteo-mcp](https://github.com/schlp/open-meteo-mcp)
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)

## Migration Notes

This is a complete rewrite from Python, maintaining feature parity:

| Aspect | Python | TypeScript |
|--------|--------|------------|
| Framework | FastMCP | MCP SDK |
| Validation | Pydantic | Zod |
| Runtime | Python 3.11+ | Deno 1.40+ |
| Tests | 137 pytest | 144 Deno test |
| HTTP | httpx | Fetch API |

**Breaking changes**: None - MCP protocol is identical

## Tips for Working with This Codebase

1. **Always read files before editing** - Don't guess at implementation details
2. **Run tests frequently** - `deno task test:watch` during development
3. **Use type inference** - Let TypeScript help you
4. **Check API docs** - Open-Meteo has excellent documentation
5. **Test with Inspector** - Visual debugging is invaluable
6. **Follow conventions** - Consistency matters for maintainability
7. **Keep it simple** - Don't over-engineer solutions
8. **Validate everything** - External data is untrusted

## Getting Help

- **Documentation**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Reference**: [Open-Meteo Docs](https://open-meteo.com/en/docs)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issue Tracker**: [GitHub Issues](https://github.com/schlp/open-meteo-mcp-ts/issues)

---

**Last Updated**: 2026-01-29
**MCP Version**: 4.0.0
**Deno Version**: 1.40+
