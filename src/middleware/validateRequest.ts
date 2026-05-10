import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export function validateRequest(schema: ZodTypeAny, part: RequestPart = 'body'): RequestHandler {
  return (req: Request, _res, next) => {
    const parsed = schema.parse(req[part]);
    (req as unknown as Record<string, unknown>)[part] = parsed;
    next();
  };
}
