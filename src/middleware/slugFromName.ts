import type { RequestHandler } from 'express';
import slugify from 'slugify';

export function slugFromName(field = 'name'): RequestHandler {
  return (req, _res, next) => {
    const body = req.body as Record<string, string | undefined>;
    const name = body[field];
    if (name && !body.slug) {
      body.slug = slugify(name, { lower: true });
    }
    next();
  };
}
