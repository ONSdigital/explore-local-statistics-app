#!/bin/bash -eux

pushd explore-local-statistics-app
  npm install --unsafe-perm
  npm run audit
popd
