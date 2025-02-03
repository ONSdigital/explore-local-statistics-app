# Stage 1 - Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Set a custom var to use the Node adapter for the build
ENV SVELTEKIT_ADAPTER=node
# Set a custom var for the production base path
ENV SVELTEKIT_BASE_PATH=/explore-local-statistics
# bring in - and then use - short commit-hash for path for assets
ARG commit_hash=zzzz
ENV SVELTEKIT_ASSETS_PATH=/explore-local-statistics/$commit_hash

# Build the application
RUN npm run build

# Remove unnecessary dev packages
RUN npm prune --production

# -------------------------------------------------------
# Stage 2 - Run
FROM node:18-alpine
WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set a custom var to use the Node adapter at runtime
ENV SVELTEKIT_ADAPTER=node
# Set a custom var for the production base path
ENV SVELTEKIT_BASE_PATH=/explore-local-statistics
# bring in - and then use - short commit-hash for path for assets
ARG commit_hash=zzzz
ENV SVELTEKIT_ASSETS_PATH=/explore-local-statistics/$commit_hash
# Set the standard NODE_ENV var to production
ENV NODE_ENV=production

# The Node adapter server defaults to port 3000
EXPOSE 3000

# Start the app (node build/index.js)
CMD ["node", "build"]
