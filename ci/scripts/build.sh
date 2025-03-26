#!/bin/sh -eux

# make for build
apk add --no-cache make

cwd=$(pwd)
app_dir=explore-local-statistics-app
BUILD="$cwd/build"

cd "$app_dir"

    SHORT_REF=$(cat .git/short_ref) # XXX not needed TODO
    [[ -n "$SHORT_REF" ]]   # check that git returned valid value

    # need to build for app and assets
    make build-builder-init \
         build \
            IMAGE_TAG=concourse-${AWS_PROFILE}-${SHORT_REF} \
            COMMIT_HASH=${SHORT_REF}

    mkdir "$BUILD/app"
    cp -a Dockerfile.concourse build node_modules package.json "$BUILD/app"

    mkdir -p "$BUILD/assets/${SHORT_REF}"
    cp -a "build/client/explore-local-statistics/." "$BUILD/assets/${SHORT_REF}"

cd "$cwd"
