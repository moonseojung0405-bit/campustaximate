import assert from 'node:assert/strict';

const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173');
const headers = { 'User-Agent': 'Kakaotalk-Scrap/1.0' };
const response = await fetch(base, { headers });
assert.equal(response.status, 200, 'The homepage must be public to link crawlers.');
const html = await response.text();
const head = html.slice(0, html.indexOf('</head>'));
assert.ok(head, 'Metadata must be present in the initial document head.');

function meta(name) {
  const tag = [...head.matchAll(/<meta\b[^>]*>/g)].map(match => match[0])
    .find(value => value.includes(`property="${name}"`) || value.includes(`name="${name}"`));
  assert.ok(tag, `Missing ${name}`);
  const content = /content="([^"]+)"/.exec(tag)?.[1];
  assert.ok(content, `Empty ${name}`);
  return content.replaceAll('&amp;', '&');
}

assert.match(meta('og:title'), /학교 같이타/);
assert.match(meta('og:description'), /어천역.*초지역/);
assert.equal(meta('og:locale'), 'ko_KR');
assert.equal(meta('og:type'), 'website');
assert.equal(meta('twitter:card'), 'summary_large_image');

for (const key of ['og:image', 'twitter:image']) {
  const imageUrl = new URL(meta(key));
  if (base.hostname === 'localhost' || base.hostname === '127.0.0.1') {
    // Next.js intentionally resolves generated metadata images against localhost in dev.
    assert.ok(['localhost', '127.0.0.1', 'campustaximate.vercel.app'].includes(imageUrl.hostname));
  } else {
    assert.equal(imageUrl.origin, 'https://campustaximate.vercel.app', 'Sharing images must use the public production domain.');
  }
  const imageResponse = await fetch(new URL(imageUrl.pathname + imageUrl.search, base), { headers });
  assert.equal(imageResponse.status, 200, `${key} must load without a session.`);
  assert.match(imageResponse.headers.get('content-type') || '', /^image\/png/);
  const png = Buffer.from(await imageResponse.arrayBuffer());
  assert.ok(png.byteLength < 5 * 1024 * 1024, 'Preview image must be below Kakao’s 5 MB limit.');
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  console.log(`${key}: public 1200 × 630 PNG, ${Math.round(png.byteLength / 1024)} KB`);
}

const robots = await fetch(new URL('/robots.txt', base), { headers });
assert.equal(robots.status, 200);
assert.match(await robots.text(), /Allow: \/(?:\r?\n|$)/);
console.log('Social preview metadata and anonymous crawler access verified.');
