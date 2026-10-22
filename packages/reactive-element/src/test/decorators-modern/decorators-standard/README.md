This folder is excluded from the plain tsconfig that uses
`experimentalDecorators: true` because it includes decorators on private class
members which aren't allowed by experimental decorators.
