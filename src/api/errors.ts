export class ApiError extends Error {
  constructor(public status: number, message: string, public raw?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
