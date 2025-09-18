// app/proxy/[...path]/route.js
export const runtime = "nodejs";

// Primary: Render backend (ENV ile değiştirilebilir)
const PRIMARY =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://final-project-backend-1-onmi.onrender.com";

// Fallback: local backend
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
  if (!["GET", "HEAD"].includes(method)) body = await req.arrayBuffer();
  return { method, headers, body, redirect: "manual" };
}

async function tryOnce(base, req) {
  const init = await cloneInit(req);
  const search = req.nextUrl.search || "";
  const path = req.nextUrl.pathname.replace(/^\/proxy/, "");
  const url = `${base}${path}${search}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function sanitizeResp(res) {
  const headers = new Headers(res.headers);
  // we are same-origin now; upstream CORS headerlarını dışarı sızdırma
  for (const k of headers.keys()) {
    if (k.toLowerCase().startsWith("access-control-allow-")) headers.delete(k);
  }
  return new Response(res.body, { status: res.status, headers });
}

async function handle(req) {
  try {
    const first = await tryOnce(PRIMARY, req);
    if (!first.ok && first.status >= 500) throw new Error("primary-5xx");
    return sanitizeResp(first);
  } catch {
    const fb = await tryOnce(FALLBACK, req);
    return sanitizeResp(fb);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
