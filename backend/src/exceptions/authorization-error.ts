import ClientError from './client-error';

class AuthorizationError extends ClientError {
  constructor(message = 'Tidak memiliki permission', code = 'FORBIDDEN') {
    super(message, 403, code);
    this.name = 'AuthorizationError';
  }
}

export default AuthorizationError;
