import ClientError from './client-error';

class NotFoundError extends ClientError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

export default NotFoundError;
