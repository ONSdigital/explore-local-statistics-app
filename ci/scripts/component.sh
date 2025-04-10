#!/bin/sh -eux

app_dir=explore-local-statistics-app

apk add --no-cache make

cd "$app_dir"

    make test-component IMAGE_TAG=dummy_tag_for_image COMMIT_HASH=dummy_git_hash

cd -
