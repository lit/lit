export class RouterError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'RouterError';
  }
}

export class MissingPathError extends RouterError {
  constructor() {
    super('Missing path.');

    this.name = 'MissingPathError';
  }
}

export class MissingComponentError extends RouterError {
  constructor() {
    super('Missing component.');

    this.name = 'MissingComponentError';
  }
}

export class RouteNotFoundError extends RouterError {
  constructor(pathname: string) {
    super(`Route with path "${pathname}" not found.`);

    this.name = 'RouteNotFoundError';
  }
}

export class RouteAlreadyExistsError extends RouterError {
  constructor(pathname: string) {
    super(`Route with path "${pathname}" already exists.`);

    this.name = 'RouteAlreadyExistsError';
  }
}

export class RouterNotFoundError extends RouterError {
  constructor() {
    super('Router not found.');

    this.name = 'RouterNotFoundError';
  }
}
