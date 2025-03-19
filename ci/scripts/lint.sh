#!/bin/sh -eux

apk add --no-cache make

cd explore-local-statistics-app

    make lint IMAGE_TAG=dummy_tag_for_image

cd -
