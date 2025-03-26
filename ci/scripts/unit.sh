#!/bin/sh -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

cd "$app_dir"

    make test IMAGE_TAG=dummy_tag_for_image COMMIT_HASH=dummy_git_hash

cd -
