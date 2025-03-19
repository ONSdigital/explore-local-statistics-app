#!/bin/sh -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

cd "$app_dir"

    if   [[ "$APPLICATION" = "explore-local-statistics"        ]]; then

        make test

    elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then

        :   # no test for assets

    fi

cd -
