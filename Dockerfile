# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy client dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy server dependencies from builder
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy server source
COPY server/ ./server/

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p /app/server/uploads /app/server/logs

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start server
CMD ["node", "server.js"]
