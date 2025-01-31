# Stage 0 - Shared
FROM node:18-alpine AS shared
WORKDIR /app

# Custom var for the Node adapter
ENV SVELTEKIT_ADAPTER=node
# Custom var for the base path
ENV SVELTEKIT_BASE_PATH=/explore-local-statistics
# Custom var for the assets path
ENV SVELTEKIT_ASSETS_PATH=http://localhost:8080/some-path

# -------------------------------------------------------
# Stage 1 - Build
FROM shared AS builder

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the application
RUN npm run build

# Remove unnecessary dev packages
RUN npm prune --production

# -------------------------------------------------------
# Stage 2 - Run
FROM shared

# Copy only necessary files
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set the standard NODE_ENV var to production
ENV NODE_ENV=production

# The Node adapter server defaults to port 3000
EXPOSE 3000

# Start the app (node build/index.js)
CMD ["node", "build"]
