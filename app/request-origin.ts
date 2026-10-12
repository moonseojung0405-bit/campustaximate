// Next.js may use an internal hostname for request.url behind a proxy.
// The browser's Origin must match the incoming HTTP Host, not that internal URL.
export function isSameOrigin(request: Request) {
 const origin = request.headers.get('origin');
 if (!origin) return false;
 try {
  const parsed = new URL(origin);
  const host = request.headers.get('host') ?? new URL(request.url).host;
  return parsed.origin === origin && parsed.host === host.toLowerCase()
   && (parsed.protocol === 'https:' || (!process.env.VERCEL && parsed.protocol === 'http:'));
 } catch { return false; }
}
