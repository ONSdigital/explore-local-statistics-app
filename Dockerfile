# Stage 0 - Shared
FROM node:18.20.7 AS shared

WORKDIR /app

# Custom var for the Node adapter
ENV SVELTEKIT_ADAPTER=node
# Custom var for the base path
ARG SVELTEKIT_BASE_PATH
ENV SVELTEKIT_BASE_PATH=${SVELTEKIT_BASE_PATH}
# Custom var for the assets path
ARG SVELTEKIT_ASSETS_PATH
ENV SVELTEKIT_ASSETS_PATH=${SVELTEKIT_ASSETS_PATH}
# Custom var for the app version
ARG SVELTEKIT_APP_VERSION
ENV SVELTEKIT_APP_VERSION=${SVELTEKIT_APP_VERSION}

# Use s3 assets
ARG ENABLE_S3_ASSETS
ENV ENABLE_S3_ASSETS=${ENABLE_S3_ASSETS}

# -------------------------------------------------------
# Stage 1 - Build
FROM shared AS builder

# add make(1)
# vars for the Makefile
ARG IMAGE_TAG
ENV IMAGE_TAG=${IMAGE_TAG}
ARG COMMIT_HASH
ENV COMMIT_HASH=${COMMIT_HASH}
ARG AWS_ECR_ACCOUNT
ENV AWS_ECR_ACCOUNT=${AWS_ECR_ACCOUNT}

# Install dependencies
COPY Makefile package.json package-lock.json ./

# this cleans using: npm ci
RUN make build-builder-init

COPY . .

# Build the application
# and remove unnecessary dev packages
RUN make build-builder

# -------------------------------------------------------
# Stage 2 - Run
FROM shared

# Copy only necessary files from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set the standard NODE_ENV var to production
ENV NODE_ENV=production

# The Node adapter server defaults to port 3000
EXPOSE 3000

# Start the app (node build/index.js)
CMD ["node", "build"]
