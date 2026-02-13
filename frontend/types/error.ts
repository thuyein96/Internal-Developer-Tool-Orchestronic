export class ApiError extends Error {
  message: string
  error: string
  constructor(
    public statusCode: number,
    message: string,
    error: string
  ) {
    super(message)
    this.message = message
    this.error = error
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
