// Mock for @spike-land-ai/code
export const routes = {};
export const HTML = '<html><head>// IMPORTMAP</head><body><div id="embed"></div><!-- Inline LINK for initial theme --><script src="/start.mjs"></script></body></html>';
export const importMap = { imports: { react: "https://esm.sh/react" } };
export function importMapReplace(code) {
  return `replaced:${code}`;
}
export function tryCatch(fn) {
  try {
    const result = typeof fn === 'function' ? fn() : fn;
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error };
  }
}
export function applySessionDelta(session, delta) {
  return { ...session, ...delta };
}
export function serverFetchUrl(path) {
  return `https://spike.land${path}`;
}
export function serveWithCache(request, env, ctx, handler) {
  return handler(request, env, ctx);
}
let counter = 0;
export function computeSessionHash(session) {
  // Return a hash based on session content to allow change detection
  if (session) {
    return JSON.stringify(session).length.toString(36) + "-" + JSON.stringify(session).slice(0, 20);
  }
  return "hash-" + ++counter;
}
export function generateSessionPatch(oldSession, newSession) {
  return { type: "patch", changes: {} };
}
export function md5(s) {
  // Simple deterministic hash for testing
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}
export function sanitizeSession(s) {
  return s;
}
