# Multi-stage build for Open-Meteo MCP TypeScript Server
# Optimized for production deployment

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (production + dev for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm for runtime
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Make the binary executable (before switching users)
RUN chmod +x dist/main.js

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check (MCP servers run on stdio, so we can't ping them)
# This is a placeholder for when REST API is implemented
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD test -f /tmp/mcp-health || exit 1

# Run the MCP server
CMD ["node", "dist/main.js"]
