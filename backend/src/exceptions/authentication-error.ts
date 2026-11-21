import ClientError from './client-error';

class AuthenticationError extends ClientError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

export default AuthenticationError;
