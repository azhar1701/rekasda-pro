# Stage 1: Build environment
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Enable corepack/npm cache
ENV CYPRESS_INSTALL_BINARY=0

# Install dependencies first to cache this layer
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Pass build arguments (e.g., VITE_SUPABASE_URL)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application
RUN npm run build

# Stage 2: Production server (Nginx)
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Switch to non-root user (good security practice, optional depending on deployment target but recommended)
# Note: Nginx needs root to bind to port 80, so we keep root unless we change the port. For standard docker deployments, port 80 is fine.

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
