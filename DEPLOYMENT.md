# Deployment Guide - Open-Meteo MCP TypeScript

Comprehensive guide for deploying the Open-Meteo MCP weather data server in Node.js environments.

## Quick Start

### Docker (Recommended)

```bash
# Build the image
docker build -t open-meteo-mcp:latest .

# Run the container
docker run -it open-meteo-mcp:latest

# Or using docker-compose
docker-compose up -d
```

### Local Node.js

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Run the server
pnpm start
```

## System Requirements

- **Node.js**: 20.0.0 or higher
- **pnpm**: 8.0.0 or higher
- **Docker**: 20.0+ (for container deployment)
- **RAM**: 256MB minimum, 512MB recommended
- **CPU**: Single core minimum

## Deployment Options

### Option 1: Docker Container (Production)

```bash
# Build with specific tag
docker build -t open-meteo-mcp:4.1.0 .

# Run in background
docker run -d \
  --name open-meteo-mcp \
  --restart unless-stopped \
  open-meteo-mcp:4.1.0

# View logs
docker logs -f open-meteo-mcp
```

### Option 2: Docker Compose

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f open-meteo-mcp

# Stop services
docker-compose down
```

### Option 3: Bare Node.js (Development)

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run
pnpm start

# Or development mode with file watching
pnpm run dev
```

## Build & Distribution

### Build for Distribution

```bash
# Full clean build
pnpm run build

# Output location: dist/
ls -la dist/

# Key files:
# - dist/main.js (executable entry point with shebang)
# - dist/client.js (HTTP client)
# - dist/server.js (MCP server implementation)
# - dist/helpers.js (utility functions)
# - dist/models.js (type definitions and schemas)
```

## Testing Deployment

### Run Tests

```bash
# Run all tests
pnpm test

# Expected: 168/168 tests passing
# Duration: ~1.1 seconds
```

### Verify Binary Execution

```bash
# Test execution
pnpm start

# Expected output: "Open-Meteo MCP Server running on stdio"
```

## Performance Characteristics

- **Memory Usage**: 50MB base, 100-150MB with data
- **CPU Usage**: <10% at idle, scales with concurrent requests
- **Test Suite**: 168 tests in ~1.1 seconds
- **Build Time**: ~5-10 seconds on modern hardware

## Docker Security

1. **Non-root user**: Container runs as `nodejs` user (UID 1001)
2. **Multi-stage build**: Reduces final image size
3. **Resource limits**: CPU and memory constraints enforced
4. **Health checks**: Built-in monitoring

## Updating to New Version

```bash
# Pull latest code
git pull origin main

# Rebuild image
docker build -t open-meteo-mcp:latest .

# Restart container
docker-compose down
docker-compose up -d
```

## Integration with Claude Desktop

Create `.claude-desktop.json`:

```json
{
  "tools": [
    {
      "name": "open-meteo-mcp",
      "command": "node /path/to/open-meteo-mcp-ts/dist/main.js"
    }
  ]
}
```

## Troubleshooting

### Container fails to start
```bash
# Check logs
docker logs open-meteo-mcp

# Rebuild without cache
docker build -t open-meteo-mcp . --no-cache
```

### High memory usage
```bash
# Check process memory
docker stats open-meteo-mcp

# Adjust limits in docker-compose.yml
```

### Build fails
```bash
# Clean and rebuild
pnpm install --frozen-lockfile
pnpm run build
pnpm run check
```

## Version Information

- **Current Version**: v4.1.0 (Node.js)
- **Previous**: v4.0.0 (Deno), v3.x (Python), v2.x (Java)
- **Status**: Production Ready ✓

---

**Last Updated**: February 4, 2026
