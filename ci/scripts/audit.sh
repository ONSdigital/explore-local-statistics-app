#!/bin/sh -eux

apk add --no-cache make

cd explore-local-statistics-app
    make audit
    # npm install --unsafe-perm
    # npm run audit
cd -
