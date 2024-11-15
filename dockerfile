# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Set a custom var to use the Node adapter for the build
ENV SVELTEKIT_ADAPTER=node

# Build the application
RUN npm run build

# Remove unnecessary dev packages
RUN npm prune --production

# Stage 2: Run
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Set a custom var to use the Node adapter at runtime
ENV SVELTEKIT_ADAPTER=node
# Set the standard NODE_ENV var to production
ENV NODE_ENV=production

# Start the app (node build/index.js)
CMD ["node", "build"]
