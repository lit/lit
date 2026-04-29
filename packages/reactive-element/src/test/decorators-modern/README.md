This is a set of tests that use "modern" decorator syntax (`accessor`, etc) that are run with both experimental and standard decorators to ensure identical behavior between the experimental and standard decorator code paths.

The tests compiled with two tsonfigs:

- `tsconfig.json` which sets `experimentalDecorators: true`
- `tsconfig.std-decorators-tests.json` which keeps `experimentalDecorators` off and outputs to `/development/test/std-decorators`
