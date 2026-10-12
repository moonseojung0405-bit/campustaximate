/* eslint-disable @next/next/no-img-element -- ImageResponse embeds the local PNG at build time. */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

const mascot = readFile(join(process.cwd(), 'public/art/taxi-mascot.png'), 'base64');

export default async function Icon() {
  const image = await mascot;
  return new ImageResponse(
    <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0efdd', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: 64, height: 18, background: '#f7f7e9', display: 'flex' }} />
      <img src={`data:image/png;base64,${image}`} alt="" width={68} height={46} style={{ position: 'absolute', left: -2, top: 9, objectFit: 'contain' }} />
    </div>,
    size,
  );
}
