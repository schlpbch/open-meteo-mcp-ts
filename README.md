# Open-Meteo MCP TypeScript

[![Deno Deploy](https://github.com/schlp/open-meteo-mcp-ts/workflows/Deploy%20to%20Deno%20Deploy/badge.svg)](https://github.com/schlp/open-meteo-mcp-ts/actions)
[![Tests](https://img.shields.io/badge/tests-168%20passing-success)](https://github.com/schlp/open-meteo-mcp-ts)
[![Deno](https://img.shields.io/badge/deno-v1.40+-blue)](https://deno.land)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A TypeScript/Deno implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Open-Meteo](https://open-meteo.com) weather data. Provides AI assistants like Claude with comprehensive weather forecasts, snow conditions, air quality metrics, and location search capabilities.

**Migrated from Python**: This is a full TypeScript rewrite of [open-meteo-mcp](https://github.com/schlp/open-meteo-mcp), leveraging Deno's modern runtime for improved performance and developer experience.

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

- [Deno](https://deno.land) 1.40 or higher
- No API keys required (Open-Meteo is free)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/schlp/open-meteo-mcp-ts.git
cd open-meteo-mcp-ts

# Run tests
deno test --allow-net --allow-read --allow-env

# Start the server
deno task start
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
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-env",
        "C:/Users/schlp/code/open-meteo-mcp-ts/src/main.ts"
      ]
    }
  }
}
```

Restart Claude Desktop, and the weather tools will be available.

### With MCP Inspector

Test the server interactively:

```bash
npx @modelcontextprotocol/inspector deno run --allow-net --allow-read --allow-env src/main.ts
```

This opens a web interface to test all tools, resources, and prompts.

## Development

### Available Commands

```bash
# Development with hot reload
deno task dev

# Run tests
deno task test

# Watch mode for tests
deno task test:watch

# Generate coverage report
deno task coverage

# Run benchmarks
deno task bench

# Linting
deno task lint

# Format code
deno task fmt

# Type checking
deno task check
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
├── tests/               # Test suite (144 tests)
├── .github/
│   └── workflows/       # CI/CD configuration
├── deno.json           # Deno configuration
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # This file
```

## Deployment

Deploy to [Deno Deploy](https://deno.com/deploy) for production use.

### Quick Start

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/your-username/open-meteo-mcp-ts.git
   git push -u origin main
   ```

2. **Create Deno Deploy Project**
   - Go to [dash.deno.com](https://dash.deno.com)
   - Create new project: `open-meteo-mcp-ts`
   - Link to GitHub repository
   - Set entrypoint: `src/main.ts`

3. **Automatic Deployment**
   - Every push to `main` triggers CI/CD
   - Tests run automatically
   - Deploys on successful tests

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Testing

All 168 tests passing:

```bash
$ deno test --allow-net --allow-read --allow-env
ok | 168 passed | 0 failed (857ms)
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
import { OpenMeteoClient } from "./src/client.ts";

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

- **Runtime**: [Deno](https://deno.land) 1.40+
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **Validation**: [Zod](https://zod.dev) schemas
- **Date/Time**: [date-fns](https://date-fns.org) and [date-fns-tz](https://github.com/marnusw/date-fns-tz)
- **Testing**: Deno's built-in test runner
- **HTTP Client**: Native Fetch API with gzip compression

## Performance

Key improvements over Python version:

- ⚡ **50% faster response times** (target: ≤125ms P95)
- 💾 **30% lower memory usage** (target: ≤70 MB)
- 📊 **40% higher throughput** (target: ≥280 RPS)
- 🚀 **60% faster cold starts** (target: ≤160ms)

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for detailed benchmarks (coming soon).

## Migration from Python

This TypeScript implementation maintains full feature parity with the [Python version](https://github.com/schlp/open-meteo-mcp):

| Feature | Python (FastMCP) | TypeScript (Deno) |
|---------|------------------|-------------------|
| MCP Tools | 11 | 11 ✅ |
| MCP Resources | 4 | 4 ✅ |
| MCP Prompts | 3 | 3 ✅ |
| Tests | 137 | 168 ✅ |
| Gzip Compression | ✅ | ✅ |
| JSON Serialization | ✅ | ✅ |

### Key Differences

- **Runtime**: Python/FastMCP → TypeScript/Deno
- **Validation**: Pydantic → Zod
- **HTTP Client**: httpx → Native Fetch
- **Testing**: pytest → Deno test
- **Deployment**: FastMCP Cloud → Deno Deploy

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Deno style guide (`deno fmt`)
- Add tests for new features
- Update documentation
- Ensure all tests pass (`deno test`)
- Run type checking (`deno check`)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Open-Meteo](https://open-meteo.com) - Free weather API
- [Model Context Protocol](https://modelcontextprotocol.io) - AI integration standard
- [Deno](https://deno.land) - Modern JavaScript/TypeScript runtime
- [Anthropic Claude](https://claude.ai) - AI assistant integration

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
