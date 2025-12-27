# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Build argument for PocketBase URL (Vite requires env vars at build time)
ARG VITE_POCKETBASE_URL
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source files
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM pierrezemb/gostatic

# Copy built files from builder stage
COPY --from=builder /app/dist /srv/http/

# Configure gostatic
CMD ["-port", "8080", "-https-promote", "-enable-logging"]
