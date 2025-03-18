#!/bin/sh -eux

apk add --no-cache make git

cwd=$(pwd)
app_dir=explore-local-statistics-app
BUILD="$cwd/build"

cd "$app_dir"

    SHORT_REF=$(git rev-parse --short HEAD) # XXX not needed TODO

    make build-builder-init \
         build \
            ENABLE_S3_ASSETS=false \
            IMAGE_TAG=dummy-concourse-${SHORT_REF} \
            COMMIT_HASH=${SHORT_REF}

    if   [[ "$APPLICATION" = "explore-local-statistics"        ]]; then

        cp -a Dockerfile.concourse build node_modules package.json "$BUILD"

        ls "$BUILD"

    elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then

        cp -a "build/client/explore-local-statistics" "$BUILD"

    fi

cd "$cwd"
