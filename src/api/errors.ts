export class ApiError extends Error {
  status: number;
  raw?: unknown;

  constructor(status: number, message: string, raw?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.raw = raw;
  }
}
