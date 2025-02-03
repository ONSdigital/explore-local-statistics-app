AWS_PROFILE?=dp-bleed-dev
AWS_REGION?=eu-west-2
AWS_ECR_ACCOUNT?=$(shell aws sts --profile $(AWS_PROFILE) get-caller-identity --query Account --output text)
AWS_ECR_URL?=$(AWS_ECR_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com

IMAGE_TAG?=$(error Must use: make TAG=tag_for_image)
IMAGE_NAME?=onsdigital/explore-local-statistics-app
IMAGE_URL?=$(AWS_ECR_URL)/$(IMAGE_NAME)

COMMIT_HASH=$(shell git rev-parse --short HEAD)

PORT?=3000

.PHONY: build
build:
	docker build --build-arg commit_hash=$(COMMIT_HASH) --tag $(IMAGE_URL):$(IMAGE_TAG) .

.PHONY: debug
debug:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: push
push:
	docker push $(IMAGE_URL):$(IMAGE_TAG)

.PHONY: run
run:
	docker run -p $(PORT):$(PORT) $(IMAGE_URL):$(IMAGE_TAG)


.PHONY: deps
deps:
	npm i -D @sveltejs/adapter-node
