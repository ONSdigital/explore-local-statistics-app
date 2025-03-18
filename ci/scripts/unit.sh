#!/bin/bash -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

pushd "$app_dir"
    if   [[ "$APPLICATION" = "explore-local-statistics-app" ]]; then
        make test

    elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then
        :   # no test for assets
    fi
popd
