export const runtime = "nodejs"; // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic"; // never prerender/cache this
export const revalidate = 0; // no ISR

const PRIMARY =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://final-project-backend-1-onmi.onrender.com";

const FALLBACK = "http://localhost:5517";

function stripHopHeaders(h) {
  const out = new Headers(h);
  for (const k of [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
  ])
    out.delete(k);
  return out;
}

async function cloneInit(req) {
  const method = req.method || "GET";
  const headers = stripHopHeaders(req.headers);

  let body;
  if (!["GET", "HEAD"].includes(method)) {
    body = await req.arrayBuffer();
  }

  return { method, headers, body, redirect: "manual" };
}

function buildTargetUrl(base, req) {
  const search = req.nextUrl.search || "";
  const path = req.nextUrl.pathname.replace(/^\/proxy/, "");
  return `${base}${path}${search}`;
}

async function tryOnce(base, req, timeoutMs = 6500) {
  const init = await cloneInit(req);
  const url = buildTargetUrl(base, req);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function sanitizeResp(res) {
  const headers = new Headers(res.headers);
  for (const k of headers.keys()) {
    if (k.toLowerCase().startsWith("access-control-allow-")) headers.delete(k);
  }
  return new Response(res.body, {
    status: res.status,
    headers,
  });
}

async function handle(req) {
  try {
    const first = await tryOnce(PRIMARY, req);

    if (!first.ok && first.status >= 500) throw new Error("primary-5xx");
    return sanitizeResp(first);
  } catch {
    try {
      const fb = await tryOnce(FALLBACK, req, 3000);
      return sanitizeResp(fb);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "UpstreamUnavailable",
          message: "Both PRIMARY and FALLBACK upstreams are unavailable.",
        }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
  }
}

export function OPTIONS() {
  return new Response(null, { status: 200 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
