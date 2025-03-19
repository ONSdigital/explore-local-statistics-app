#!/bin/sh -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

cd "$app_dir"

    SHORT_REF=$(git rev-parse --short HEAD)
    make build IMAGE_TAG=${SHORT_REF}

cd -

mkdir build/$SHORT_REF

if   [[ "$APPLICATION" = "explore-local-statistics"        ]]; then

    cp -a "$app_dir/build" build/$SHORT_REF

elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then

    cp -a "$app_dir/build/client/explore-local-statistics" build/$SHORT_REF

fi
