class ClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;

  constructor(
    message: string,
    statusCode = 400,
    code = 'BAD_REQUEST',
    details: unknown = null,
  ) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export default ClientError;
