export ENABLE_S3_ASSETS?=false
APP=explore-local-statistics

# where this will run (for CDN)
AWS_PROFILE?=dp-sandbox
AWS_REGION?=eu-west-2

# where the docker image goes
ECR_AWS_PROFILE?=dp-ci
AWS_ECR_ACCOUNT?=$(shell aws sts --profile $(ECR_AWS_PROFILE) get-caller-identity --query Account --output text)
AWS_ECR_URL?=$(AWS_ECR_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com

IMAGE_TAG?=$(error Must use: make IMAGE_TAG=tag_for_image)
IMAGE_NAME?=explore-local-statistics
IMAGE_URL?=$(AWS_ECR_URL)/$(IMAGE_NAME)

# 7 matches that from cdn-assets image put short_ref (for ECR)
COMMIT_HASH?=$(shell git rev-parse --short=7 HEAD)

NVM_SOURCE_PATH ?= $(HOME)/.nvm/nvm.sh
ifneq ("$(wildcard $(NVM_SOURCE_PATH))","")
	NVM_EXEC = source $(NVM_SOURCE_PATH) && nvm exec --
endif
NPM = $(NVM_EXEC) npm

PORT?=3000

S3_CDN_BUCKET?=ons-$(AWS_PROFILE)-cdn
S3_PREFIX?=explore-local-statistics/$(COMMIT_HASH)
AWS_S3_CDN_URL?=s3://$(S3_CDN_BUCKET)/$(S3_PREFIX)

ifeq ($(ENABLE_S3_ASSETS),true)

# XXX keep SVELTEKIT_ASSETS_PATH value aligned with the $(APP).nomad plan file
ifeq      ($(AWS_PROFILE),dp-prod)
export SVELTEKIT_ASSETS_PATH=https://cdn.ons.gov.uk/$(S3_PREFIX)
else ifeq ($(AWS_PROFILE),dp-sandbox)
export SVELTEKIT_ASSETS_PATH=https://cdn.sandbox.onsdigital.co.uk/$(S3_PREFIX)
else ifeq ($(AWS_PROFILE),dp-staging)
export SVELTEKIT_ASSETS_PATH=https://cdn.staging.onsdigital.co.uk/$(S3_PREFIX)
else
$(error makefile not prepared for AWS_PROFILE=$(AWS_PROFILE))
endif

else # ENABLE_S3_ASSETS is false
export SVELTEKIT_ASSETS_PATH=
endif # ENABLE_S3_ASSETS

export SVELTEKIT_BASE_PATH=/explore-local-statistics
export SVELTEKIT_ADAPTER=node
export SVELTEKIT_APP_VERSION=$(COMMIT_HASH)

.PHONY: build
build: build-builder

.PHONY: audit
audit:
	$(NPM) install --unsafe-perm
	$(NPM) run audit

.PHONY: lint
lint:
	exit 0 # no-op for now XXX
	# $(NPM) install --unsafe-perm
	# $(NPM) run lint

.PHONY: build-local
build-local:
	docker build	--build-arg SVELTEKIT_BASE_PATH=$(SVELTEKIT_BASE_PATH)		\
			--build-arg SVELTEKIT_ASSETS_PATH=$(SVELTEKIT_ASSETS_PATH)	\
			--build-arg SVELTEKIT_APP_VERSION=$(SVELTEKIT_APP_VERSION)	\
			--build-arg AWS_ECR_ACCOUNT=$(AWS_ECR_ACCOUNT)			\
			--build-arg COMMIT_HASH=$(COMMIT_HASH)				\
			--build-arg IMAGE_TAG=$(IMAGE_TAG)				\
			--build-arg AWS_PROFILE=$(AWS_PROFILE)				\
			--build-arg ENABLE_S3_ASSETS=$(ENABLE_S3_ASSETS)		\
			--tag $(IMAGE_URL):$(IMAGE_TAG) .

.PHONY: debug
debug:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: push
push: push-image push-assets
.PHONY: push-image
push-image:
	AWS_PROFILE=$(AWS_ECR_ACCOUNT) docker push $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: push-assets
push-assets:
ifeq ($(ENABLE_S3_ASSETS),true)
	@echo "WANT: aws s3 cp --recursive ./build/client/explore-local-statistics $(AWS_S3_CDN_URL)"
else
	@echo "SKIPPING (no data separation requested): aws s3 cp --recursive ./build/client/explore-local-statistics $(AWS_S3_CDN_URL)"
endif

.PHONY: run
run:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: test
test:
	$(NPM) install --unsafe-perm
	$(NPM) run test:unit

.PHONY: test-component
test-component:
	exit 0 # no-op

# the `build-builder*` targets are separated deliberately, trying to keep consistent across:
# - local builds: `Dockerfile`
# - CI    builds: `ci/scripts/build.sh`

.PHONY: build-builder-init
build-builder-init:
	$(NPM) install
	$(NPM) ci

.PHONY: build-builder
build-builder:
	$(NPM) run build
	$(NPM) prune --production
