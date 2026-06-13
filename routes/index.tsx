import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    return Response.redirect(new URL("/app", _req.url), 302);
  },
};
