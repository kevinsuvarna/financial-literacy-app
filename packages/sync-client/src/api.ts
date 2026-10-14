import type { z } from 'zod';
import {
  playerSchema,
  postEventsResponseSchema,
  progressSchema,
  putProgressResponseSchema,
  type GameEvent,
  type Player,
  type PostEventsResponse,
  type Progress,
  type PutProgressResponse,
} from '@app/api-contract';

export type SyncApiErrorKind =
  /** The request never got an answer: offline, DNS, CORS, a dropped connection. */
  | 'network'
  /** The server answered that it couldn't cope (5xx), or asked to be tried later. */
  | 'server'
  /** The player (or their save) isn't known to the server. */
  | 'not_found'
  /** The server understood the request and refused it. Sending it again won't help. */
  | 'rejected'
  /** The answer wasn't what the contract says it should be. */
  | 'bad_response';

export class SyncApiError extends Error {
  constructor(
    readonly kind: SyncApiErrorKind,
    /** Whether the same request might succeed later. */
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(status === undefined ? `sync: ${kind}` : `sync: ${kind} (${status})`);
    this.name = 'SyncApiError';
  }
}

export interface RegisteredPlayer extends Player {
  /** True if the server had not seen this id before — so it can have nothing saved for it. */
  isNew: boolean;
}

/** What the sync engine needs from the server. */
export interface SyncApi {
  /** Registers `id`. Safe to repeat. */
  registerPlayer(id: string): Promise<RegisteredPlayer>;
  /** The player's saved game, or null if there isn't one. */
  getProgress(id: string): Promise<Progress | null>;
  putProgress(id: string, progress: Progress): Promise<PutProgressResponse>;
  postEvents(id: string, events: GameEvent[]): Promise<PostEventsResponse>;
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Talks to apps/api over HTTP. Requests carry no cookies, credentials or referrer — the player
 * id in the request is all the server learns — and every answer is checked against the
 * contract before it is believed.
 */
export function createHttpSyncApi(baseUrl: string, fetchImpl: Fetch = fetch): SyncApi {
  const root = baseUrl.replace(/\/+$/, '');

  async function send<S extends z.ZodType>(
    method: string,
    path: string,
    schema: S,
    body?: unknown,
  ): Promise<{ data: z.infer<S>; status: number }> {
    let response: Response;
    try {
      response = await fetchImpl(`${root}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
    } catch {
      throw new SyncApiError('network', true);
    }

    if (!response.ok) {
      const { status } = response;
      if (status === 404) throw new SyncApiError('not_found', false, status);
      if (status >= 500 || status === 429 || status === 408) {
        throw new SyncApiError('server', true, status);
      }
      throw new SyncApiError('rejected', false, status);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new SyncApiError('bad_response', false, response.status);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new SyncApiError('bad_response', false, response.status);
    return { data: parsed.data, status: response.status };
  }

  async function request<S extends z.ZodType>(
    method: string,
    path: string,
    schema: S,
    body?: unknown,
  ): Promise<z.infer<S>> {
    return (await send(method, path, schema, body)).data;
  }

  return {
    async registerPlayer(id) {
      const { data, status } = await send('POST', '/players', playerSchema, { id });
      return { ...data, isNew: status === 201 };
    },

    async getProgress(id) {
      try {
        return await request('GET', `/progress/${id}`, progressSchema);
      } catch (error) {
        if (error instanceof SyncApiError && error.kind === 'not_found') return null;
        throw error;
      }
    },

    putProgress: (id, progress) =>
      request('PUT', `/progress/${id}`, putProgressResponseSchema, progress),

    postEvents: (id, events) =>
      request('POST', '/events', postEventsResponseSchema, { playerId: id, events }),
  };
}
