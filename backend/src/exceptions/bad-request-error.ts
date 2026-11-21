import ClientError from './client-error';

class BadRequestError extends ClientError {
  constructor(
    message: string,
    code = 'BAD_REQUEST',
    details: unknown = null,
  ) {
    super(message, 400, code, details);
    this.name = 'BadRequestError';
  }
}

export default BadRequestError;
