#!/bin/sh -eux

apk add --no-cache make

app_dir=explore-local-statistics-app

cd "$app_dir"

    if   [[ "$APPLICATION" = "explore-local-statistics"        ]]; then

        make test-component IMAGE_TAG=dummy_tag_for_image COMMIT_HASH=dummy_git_hash

    elif [[ "$APPLICATION" = "explore-local-statistics-assets" ]]; then

        :   # no test for assets

    fi

cd -
