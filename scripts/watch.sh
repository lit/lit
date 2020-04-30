#!/usr/bin/env bash

trap "kill 0" EXIT

npm run clean
npx tsc --watch --noEmitOnError &
npx ava --verbose --watch &
npx chokidar "src/**/*.ts" .eslintrc.json -c "npm run lint" &

wait
