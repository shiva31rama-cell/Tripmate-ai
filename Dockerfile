# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifest first for better Docker layer caching.
COPY package.json ./

# The repository currently does not commit a lockfile, so npm install is intentional.
RUN npm install

# Copy the application source.
COPY . .

# Build the production Vite bundle.
RUN npm run build

# Runtime stage
FROM nginx:1.29-alpine AS runtime

# Replace the default nginx site with a SPA-aware configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Serve the Vite production bundle.
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as a non-root nginx worker where supported by the base image.
EXPOSE 80

# Lightweight container health check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
