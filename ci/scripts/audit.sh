#!/bin/sh -eux

apk add --no-cache make

pushd explore-local-statistics-app
    make audit
    # npm install --unsafe-perm
    # npm run audit
popd
