# Deployment Guide

This guide covers deploying the Open-Meteo MCP TypeScript server to Deno Deploy.

## Prerequisites

1. **Deno Deploy Account**: Sign up at [deno.com/deploy](https://deno.com/deploy)
2. **GitHub Account**: For CI/CD integration
3. **GitHub Repository**: Push your code to GitHub

## Deployment Options

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

This project includes a GitHub Actions workflow that automatically deploys to Deno Deploy on every push to the `main` branch.

#### Setup Steps:

1. **Create Deno Deploy Project**
   - Go to [dash.deno.com](https://dash.deno.com)
   - Click "New Project"
   - Name it: `open-meteo-mcp-ts`
   - Link to your GitHub repository
   - Set entrypoint: `src/main.ts`

2. **Configure GitHub Secrets** (if using deployctl directly)
   - In your GitHub repository, go to Settings > Secrets and variables > Actions
   - Add secret: `DENO_DEPLOY_TOKEN`
   - Get token from Deno Deploy dashboard under Access Tokens

3. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Setup deployment"
   git push origin main
   ```

4. **Verify Deployment**
   - Check GitHub Actions tab for workflow status
   - View deployment logs in Deno Deploy dashboard
   - Your MCP server will be available at: `https://open-meteo-mcp-ts.deno.dev`

#### CI/CD Workflow Features:

- ✅ Automatic formatting check (`deno fmt --check`)
- ✅ Linting (`deno lint`)
- ✅ Type checking (`deno check`)
- ✅ Full test suite (`deno test`)
- ✅ Automatic deployment on successful tests
- ✅ Pull request checks (no deployment)

### Option 2: Manual Deployment via CLI

Install deployctl:
```bash
deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

Deploy manually:
```bash
deployctl deploy --project=open-meteo-mcp-ts src/main.ts
```

### Option 3: Deployment via Deno Deploy Dashboard

1. Go to [dash.deno.com](https://dash.deno.com)
2. Create new project or select existing
3. Link to GitHub repository
4. Configure:
   - **Entrypoint**: `src/main.ts`
   - **Include files**: All
   - **Production branch**: `main`
5. Click "Deploy"

## Environment Configuration

### Required Permissions

The MCP server requires these Deno permissions:
- `--allow-net`: Network access for Open-Meteo API calls
- `--allow-read`: File system read for data resources (JSON files)
- `--allow-env`: Environment variable access (optional, for configuration)

### Environment Variables (Optional)

You can configure these in Deno Deploy dashboard:

- `LOG_LEVEL`: Set to `DEBUG`, `INFO`, `WARN`, or `ERROR` (default: `INFO`)
- `TIMEOUT`: Request timeout in milliseconds (default: `30000`)

## MCP Server Usage

### Claude Desktop Integration

After deployment, configure Claude Desktop to use your deployed server:

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
        "https://open-meteo-mcp-ts.deno.dev/main.ts"
      ]
    }
  }
}
```

**Note**: For production use, you'll want to run the server locally via stdio transport, not via HTTP. The deployed version is primarily for testing and development.

### Local MCP Server (Recommended for Production)

For production Claude Desktop usage, run locally:

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
        "c:/Users/schlp/code/open-meteo-mcp-ts/src/main.ts"
      ]
    }
  }
}
```

## Testing Your Deployment

### Using MCP Inspector

Test the deployed MCP server:

```bash
npx @modelcontextprotocol/inspector deno run --allow-net --allow-read --allow-env src/main.ts
```

This will open a web interface where you can:
- Test all 11 MCP tools
- View all 4 resources
- Try all 3 prompts
- Inspect request/response messages

### Health Check

The MCP server uses stdio transport, so there's no HTTP health endpoint. However, you can verify it's working by:

1. Running locally: `deno task start`
2. Testing with MCP Inspector
3. Connecting from Claude Desktop

## Monitoring and Logs

### Deno Deploy Dashboard

- **Logs**: View real-time logs in the Deno Deploy dashboard
- **Metrics**: Monitor request count, response time, and error rate
- **Deployments**: View deployment history and rollback if needed

### GitHub Actions

- Check the Actions tab in your GitHub repository
- View test results and deployment logs
- Get notified of failures via GitHub notifications

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs** for error messages
2. **Verify Deno version**: Ensure using Deno 1.40+
3. **Check permissions**: Ensure GitHub Actions has necessary permissions

### MCP Server Not Working

1. **Test locally first**: `deno task start`
2. **Run tests**: `deno test --allow-net --allow-read --allow-env`
3. **Check MCP Inspector**: Test with inspector before deploying
4. **Verify stdio transport**: MCP servers use stdio, not HTTP

### Type Errors

1. **Run type check**: `deno check src/**/*.ts`
2. **Fix strict mode errors**: Enable `strict: true` in deno.json
3. **Update dependencies**: `deno cache --reload src/main.ts`

## Rolling Back

If you need to roll back a deployment:

1. **Via Deno Deploy Dashboard**:
   - Go to your project's deployments page
   - Find the previous working deployment
   - Click "Promote to Production"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Via CLI**:
   ```bash
   deployctl deploy --project=open-meteo-mcp-ts --prod <deployment-id>
   ```

## Performance Optimization

### Caching

Deno Deploy automatically caches:
- NPM packages
- JSR modules
- Static assets

### Best Practices

1. **Minimize dependencies**: Use Deno standard library when possible
2. **Use native fetch**: No need for HTTP client libraries
3. **Enable compression**: Deno Deploy handles gzip automatically
4. **Optimize cold starts**: Keep bundle size small

## Security

### API Keys

This server doesn't require API keys (Open-Meteo is free), but if you add paid services:

1. Store keys in Deno Deploy environment variables
2. Never commit keys to Git
3. Use `.env` files only for local development (add to `.gitignore`)

### Rate Limiting

Open-Meteo has rate limits (~10,000 requests/day on free tier). Consider:

1. Caching responses (add to server.ts)
2. Implementing client-side rate limiting
3. Upgrading to Open-Meteo paid tier if needed

## Cost

- **Deno Deploy**: Free tier includes 100GB bandwidth/month, 100ms CPU time/request
- **Open-Meteo API**: Free for non-commercial use (10,000 requests/day)
- **GitHub Actions**: Free for public repositories (2,000 minutes/month)

## Support

- **Deno Deploy Docs**: https://deno.com/deploy/docs
- **Deno Discord**: https://discord.gg/deno
- **MCP Documentation**: https://modelcontextprotocol.io
- **Open-Meteo API**: https://open-meteo.com/en/docs

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Configure Deno Deploy project
3. ✅ Push code to trigger deployment
4. ✅ Test with MCP Inspector
5. ✅ Configure Claude Desktop
6. ✅ Monitor logs and metrics
