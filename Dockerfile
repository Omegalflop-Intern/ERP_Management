FROM node:18-alpine AS base
WORKDIR /app

# Server
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Client build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Copy server source
COPY server/ ./server/
RUN mkdir -p server/uploads/products server/uploads/images server/uploads/invoices

EXPOSE 5000

CMD ["node", "server/server.js"]
