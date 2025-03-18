#!/bin/sh -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

pushd "$app_dir"
  SHORT_REF=$(git rev-parse --short HEAD)
  make build IMAGE_TAG=${SHORT_REF}
popd

if   [[ "$APPLICATION" = "explore-local-statistics-app" ]]; then
    mkdir build/$SHORT_REF
    cp -a "$app_dir/build" build/$SHORT_REF

elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then
    mkdir build/$SHORT_REF
    cp -a "$app_dir/build/client/explore-local-statistics" build/$SHORT_REF

fi
