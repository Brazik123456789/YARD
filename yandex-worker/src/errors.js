export class ProviderError extends Error {
  constructor(category, message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'ProviderError';
    this.category = category;
    this.status = status;
  }
}

export class AuthRequiredError extends ProviderError {
  constructor(message = 'Yandex authentication is required', options) {
    super('AUTH_REQUIRED', message, options);
    this.name = 'AuthRequiredError';
  }
}

export class UnknownResultError extends ProviderError {
  constructor(message, options) {
    super('TIMEOUT_UNKNOWN_RESULT', message, options);
    this.name = 'UnknownResultError';
  }
}
