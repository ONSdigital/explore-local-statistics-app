#!/bin/sh -eux

apk add --no-cache make

cd explore-local-statistics-app

    make audit IMAGE_TAG=dummy_tag_for_image

cd -
