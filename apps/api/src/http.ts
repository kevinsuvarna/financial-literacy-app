import type { Context } from 'hono';
import type { z } from 'zod';
import type { ErrorCode, ErrorResponse } from '@app/api-contract';

const statuses = {
  invalid_request: 400,
  not_found: 404,
  payload_too_large: 413,
  internal_error: 500,
} as const satisfies Record<ErrorCode, number>;

export function errorResponse(c: Context, error: ErrorCode, issues?: ErrorResponse['issues']) {
  const body: ErrorResponse = issues ? { error, issues } : { error };
  return c.json(body, statuses[error]);
}

/**
 * Where a request was wrong, without repeating what it said: a path and zod's message. The
 * rejected value itself is never sent back (or logged) — if someone did put something personal
 * in a request, the API's answer is not where it should turn up again.
 */
function describe(error: z.ZodError): NonNullable<ErrorResponse['issues']> {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

/** The body of a request, parsed as JSON. An empty body counts as `{}`. */
async function readJson(c: Context): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const text = await c.req.text();
  if (text.trim() === '') return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

type Validated<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Parses the request body against `schema`, or builds the 400 that says what was wrong. */
export async function validateBody<S extends z.ZodType>(
  c: Context,
  schema: S,
): Promise<Validated<z.infer<S>>> {
  const json = await readJson(c);
  if (!json.ok) {
    return {
      ok: false,
      response: errorResponse(c, 'invalid_request', [
        { path: '', message: 'The body is not valid JSON.' },
      ]),
    };
  }
  return validate(c, schema, json.value);
}

/** Checks any value — a path parameter, say — against `schema`. */
export function validate<S extends z.ZodType>(
  c: Context,
  schema: S,
  value: unknown,
): Validated<z.infer<S>> {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, response: errorResponse(c, 'invalid_request', describe(result.error)) };
}
