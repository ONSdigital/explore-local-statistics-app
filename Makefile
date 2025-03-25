AWS_PROFILE?=dp-bleed-dev
AWS_REGION?=eu-west-2
AWS_ECR_ACCOUNT?=$(shell aws sts --profile $(AWS_PROFILE) get-caller-identity --query Account --output text)
AWS_ECR_URL?=$(AWS_ECR_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com

IMAGE_TAG?=$(error Must use: make TAG=tag_for_image)
IMAGE_NAME?=onsdigital/explore-local-statistics-app
IMAGE_URL?=$(AWS_ECR_URL)/$(IMAGE_NAME)

COMMIT_HASH=$(shell git rev-parse --short HEAD)

PORT?=3000

SVELTEKIT_BASE_PATH=/explore-local-statistics
SVELTEKIT_ASSETS_PATH=https://cdn.ons.gov.uk/els/$(COMMIT_HASH)
SVELTEKIT_APP_VERSION=$(COMMIT_HASH)

.PHONY: build
build:
	docker build --build-arg SVELTEKIT_BASE_PATH=$(SVELTEKIT_BASE_PATH) --build-arg SVELTEKIT_ASSETS_PATH=$(SVELTEKIT_ASSETS_PATH)  --build-arg SVELTEKIT_APP_VERSION=$(SVELTEKIT_APP_VERSION) --tag $(IMAGE_URL):$(IMAGE_TAG) .

.PHONY: debug
debug:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: push
push:
	docker push $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: run
run:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)

