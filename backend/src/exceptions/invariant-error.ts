import ClientError from './client-error';

class InvariantError extends ClientError {
  constructor(
    message: string,
    code = 'RESOURCE_CONFLICT',
    details: unknown = null,
  ) {
    super(message, 409, code, details);
    this.name = 'InvariantError';
  }
}

export default InvariantError;
