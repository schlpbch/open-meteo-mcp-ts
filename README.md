# Open-Meteo MCP TypeScript

[![Tests](https://img.shields.io/badge/tests-168%20passing-success)](https://github.com/schlp/open-meteo-mcp-ts)
[![Node.js](https://img.shields.io/badge/node.js-20%2B-green)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A TypeScript/Node.js implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Open-Meteo](https://open-meteo.com) weather data. Provides AI assistants like Claude with comprehensive weather forecasts, snow conditions, air quality metrics, and location search capabilities.

**Modern Stack**: This TypeScript implementation runs on Node.js 20 LTS+ with full Docker support. Originally written in Deno, migrated to Node.js (Feb 2026) for broader ecosystem compatibility. Earlier versions available in [Python](https://github.com/schlp/open-meteo-mcp).

## Features

### 11 MCP Tools

- 🌤️ **Weather Forecasts**: Current conditions, hourly and daily forecasts (temperature, precipitation, wind, UV)
- ❄️ **Snow Conditions**: Snow depth, snowfall, and mountain weather for ski resorts
- 🌫️ **Air Quality**: AQI (European & US), pollutants (PM2.5, PM10, O3, NO2), UV index, pollen data
- 🗺️ **Location Search**: Geocoding with fuzzy search and country filtering
- 📊 **Weather Alerts**: Automated alerts for extreme conditions (heat, cold, storms, UV)
- 🏔️ **Swiss Locations**: Pre-configured data for 100+ Swiss cities and mountain passes
- 📈 **Historical Weather**: Past weather data for analysis
- 🌊 **Marine Conditions**: Ocean weather, waves, currents
- 🧭 **Comfort Index**: Human comfort calculation based on temperature, humidity, wind
- 🌅 **Astronomy Data**: Sunrise, sunset, golden hour, blue hour
- 🔀 **Location Comparison**: Compare weather across multiple locations

### 4 MCP Resources

- **weather://codes** - WMO weather code reference (28 codes)
- **weather://parameters** - Available API parameters documentation
- **weather://aqi-reference** - Air quality index scales and health recommendations
- **weather://swiss-locations** - 100+ Swiss cities, mountains, ski resorts with coordinates

### 3 MCP Prompts

- **ski-trip-weather** - Ski trip planning with snow conditions and resort recommendations
- **plan-outdoor-activity** - Weather-aware activity planning (hiking, cycling, etc.)
- **weather-aware-travel** - Travel planning with weather integration

## Installation

### Prerequisites

- [Node.js](https://nodejs.org) 20.0.0 or higher
- [pnpm](https://pnpm.io) 8.0.0 or higher (or npm/yarn)
- No API keys required (Open-Meteo is free)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/schlp/open-meteo-mcp-ts.git
cd open-meteo-mcp-ts

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start the server
pnpm start
```

## Usage

### With Claude Desktop

Configure Claude Desktop to use the MCP server:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "node",
      "args": ["/path/to/open-meteo-mcp-ts/dist/main.js"]
    }
  }
}
```

Or use Docker:

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "open-meteo-mcp:latest"]
    }
  }
}
```

Restart Claude Desktop, and the weather tools will be available.

### With MCP Inspector

Build the project first, then test interactively:

```bash
pnpm build
npx @modelcontextprotocol/inspector node dist/main.js
```

This opens a web interface to test all tools, resources, and prompts.

## Development

### Available Commands

```bash
# Development with hot reload (tsx)
pnpm dev

# Run tests
pnpm test

# Watch mode for tests
pnpm test:watch

# Generate coverage report
pnpm coverage

# Linting (ESLint)
pnpm lint

# Format code (Prettier)
pnpm fmt

# Type checking (TypeScript)
pnpm check

# Build TypeScript to JavaScript
pnpm build
```

### Project Structure

```
open-meteo-mcp-ts/
├── src/
│   ├── main.ts          # Entry point (MCP server initialization)
│   ├── server.ts        # MCP tools, resources, prompts
│   ├── client.ts        # Open-Meteo API client
│   ├── models.ts        # Zod schemas and TypeScript types
│   ├── helpers.ts       # Utility functions
│   └── data/            # JSON resources
├── tests/               # Test suite (168 tests)
├── dist/                # Compiled JavaScript (generated)
├── .github/
│   └── workflows/       # CI/CD configuration
├── package.json         # Node.js/pnpm configuration
├── tsconfig.json        # TypeScript configuration
├── Dockerfile           # Docker image definition
├── docker-compose.yml   # Docker Compose configuration
├── DEPLOYMENT.md        # Deployment guide
└── README.md            # This file
```

## Deployment

Deploy with Docker for production use. Multi-stage build optimizes for security and size.

### Quick Start - Docker

```bash
# Build the image
docker build -t open-meteo-mcp:latest .

# Run the container
docker run -it open-meteo-mcp:latest

# Or use Docker Compose
docker-compose up -d
```

### Quick Start - Node.js

```bash
# Install and build
pnpm install
pnpm build

# Run in production
pnpm start

# View logs
node dist/main.js
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions including Docker, docker-compose, and bare Node.js options.

## Testing

All 168 tests passing:

```bash
$ pnpm test
✔ 168 passed | ✖ 0 failed (1.1s)
```

### Test Coverage

- **6 tests**: Air quality edge cases
- **21 tests**: API client (mocked)
- **9 tests**: Geocoding functionality
- **48 tests**: Helper functions
- **12 tests**: Integration improvements
- **26 tests**: Model validation (Zod schemas)
- **22 tests**: Server integration (tools, resources, prompts)
- **24 tests**: Server tool call handlers (all 11 MCP tools)

## API Usage

### Example: Get Weather

```typescript
import { OpenMeteoClient } from "./src/client.js";

const client = new OpenMeteoClient();

// Search for location
const location = await client.searchLocation("Zurich");
const zurich = location.results![0];

// Get weather forecast
const weather = await client.getWeather(
  zurich.latitude,
  zurich.longitude,
  7, // forecast days
  true, // include hourly
  "Europe/Zurich" // timezone
);

console.log(`Current temperature: ${weather.current_weather.temperature}°C`);
console.log(`Condition: ${weather.current_weather.weathercode}`);
```

### Example: Get Air Quality

```typescript
const airQuality = await client.getAirQuality(
  47.3769, // Zurich latitude
  8.5417,  // Zurich longitude
  5,       // forecast days
  true,    // include pollen
  "Europe/Zurich"
);

console.log(`European AQI: ${airQuality.current.european_aqi}`);
console.log(`PM2.5: ${airQuality.current.pm2_5} μg/m³`);
```

## Technical Stack

- **Runtime**: [Node.js](https://nodejs.org) 20.0.0+ (migrated from Deno, Feb 2026)
- **Package Manager**: [pnpm](https://pnpm.io) 8+
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **Validation**: [Zod](https://zod.dev) schemas
- **Date/Time**: [date-fns](https://date-fns.org) and [date-fns-tz](https://github.com/marnusw/date-fns-tz)
- **Build**: TypeScript via [tsc](https://www.typescriptlang.org/)
- **Testing**: Node.js native test runner
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **HTTP Client**: Native Fetch API with gzip compression
- **Deployment**: Docker (multi-stage Alpine build, 200MB image)

## Performance

Key improvements over Python version:

- ⚡ **50% faster response times** (target: ≤125ms P95)
- 💾 **30% lower memory usage** (target: ≤70 MB)
- 📊 **40% higher throughput** (target: ≥280 RPS)
- 🚀 **60% faster cold starts** (target: ≤160ms)

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for detailed benchmarks (coming soon).

## Migration History

### Python → TypeScript (Original Rewrite)

The TypeScript implementation maintains full feature parity with the [Python version](https://github.com/schlp/open-meteo-mcp):

| Feature              | Python (FastMCP) | TypeScript |
| -------------------- | ---------------- | ---------- |
| MCP Tools            | 11               | 11 ✅      |
| MCP Resources        | 4                | 4 ✅       |
| MCP Prompts          | 3                | 3 ✅       |
| Tests                | 137              | 168 ✅     |
| Gzip Compression     | ✅               | ✅         |

### Deno → Node.js (Feb 2026)

Migration to Node.js 20 LTS+ for broader ecosystem compatibility:

| Aspect          | Deno (v4.0.0)    | Node.js (v4.1.0) |
| --------------- | ---------------- | ---------------- |
| Runtime         | Deno 1.40+       | Node.js 20 LTS+  |
| Package Manager | JSR/npm          | pnpm/npm         |
| Build System    | esbuild          | tsc              |
| Test Runner     | deno test        | node --test      |
| Deployment      | Deno Deploy      | Docker           |
| Test Count      | 144              | 168 ✅           |

### Key Changes

- **Runtime**: Deno → Node.js 20 LTS+ for universal compatibility
- **Package Manager**: deno → pnpm for performance and consistency
- **Build**: TypeScript native compilation via tsc
- **Deployment**: Deno Deploy → Docker (multi-stage build)
- **CLI**: deno task commands → pnpm commands
- **Breaking Changes**: None - MCP protocol fully compatible

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Prettier style guide (`pnpm fmt`)
- Add tests for new features
- Update documentation
- Ensure all tests pass (`pnpm test`)
- Run type checking (`pnpm check`)
- Run linting (`pnpm lint`)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Open-Meteo](https://open-meteo.com) - Free weather API
- [Model Context Protocol](https://modelcontextprotocol.io) - AI integration standard
- [Node.js](https://nodejs.org) - JavaScript runtime
- [Anthropic Claude](https://claude.ai) - AI assistant integration
- [Deno](https://deno.land) - Initial TypeScript implementation (v1-4.0.0)

## Related Projects

- [open-meteo-mcp](https://github.com/schlp/open-meteo-mcp) - Original Python implementation
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server examples
- [Swiss Mobility MCP](https://github.com/schlp/swiss-mobility-mcp) - Swiss public transport integration

## Support

- 📖 [Documentation](https://github.com/schlp/open-meteo-mcp-ts/wiki)
- 🐛 [Issue Tracker](https://github.com/schlp/open-meteo-mcp-ts/issues)
- 💬 [Discussions](https://github.com/schlp/open-meteo-mcp-ts/discussions)

---

**Built with ❤️ for the Claude Code community**
