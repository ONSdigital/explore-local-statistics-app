#!/bin/sh -eux

app_dir=explore-local-statistics-app

apk add --no-cache make

cwd=$(pwd)
BUILD="$cwd/build"

cd "$app_dir"

    if   [[ -f .git/short_ref ]]; then
        SHORT_REF=$(cat .git/short_ref)
    elif [[ -f .git/resource/base_sha ]]; then
        SHORT_REF=$(cat .git/resource/base_sha)
        echo "<$SHORT_REF>"
    fi
    [[ -n "$SHORT_REF" ]]   # check that ref is a valid value
        exit 2

    # build app and assets
    #   IMAGE_TAG   to match that in CI (see tag_prefix)
    #   COMMIT_HASH to ensure upload to CDN has right S3 prefix
    make build-builder-init \
         build-builder \
         IMAGE_TAG=concourse-${AWS_PROFILE}-${SHORT_REF} \
         COMMIT_HASH=${SHORT_REF}

    # copy built app ready for final docker build
    #   CI pipeline expects app in app/
    mkdir "$BUILD/app"
    cp -a Dockerfile.concourse build node_modules package.json "$BUILD/app"

    # copy built assets ready for upload to S3/CDN
    #   CI pipeline expects assets in assets/
    mkdir -p "$BUILD/assets/${SHORT_REF}"
    cp -a "build/client/explore-local-statistics/." "$BUILD/assets/${SHORT_REF}"

cd "$cwd"
