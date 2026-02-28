import type { FastifyInstance } from 'fastify';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(422, 'PARSE_ERROR', message);
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        error: err.message,
        code: err.code,
      });
    }

    const error = err as Error & { validation?: unknown; statusCode?: number };

    // Fastify validation errors (JSON Schema)
    if (error.validation) {
      return reply.status(400).send({
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    }

    app.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });
}
