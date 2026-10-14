/* eslint-disable @next/next/no-img-element -- ImageResponse renders embedded PNGs, not a browser page. */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = '택시메이트 — 어천역·초지역에서 화성의과학대학교까지, 최대 4명 함께 타고 최대 10분 기다려요.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Read local assets at build time so link crawlers never depend on font or image services.
const font = readFile(join(process.cwd(), 'public/fonts/Galmuri11-Bold.ttf'));
const journey = readFile(join(process.cwd(), 'public/art/campus-journey.png'), 'base64');
const mascot = readFile(join(process.cwd(), 'public/art/taxi-mascot.png'), 'base64');

export default async function OpenGraphImage() {
  const [fontData, journeyData, mascotData] = await Promise.all([font, journey, mascot]);

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f7f7e9', color: '#164e3d', fontFamily: 'Galmuri', fontWeight: 700 }}>
      <div style={{ position: 'absolute', left: 620, top: 0, right: 0, bottom: 0, display: 'flex', overflow: 'hidden', background: '#dce9c7' }}>
        <img src={`data:image/png;base64,${journeyData}`} alt="" width={580} height={630} style={{ objectFit: 'cover', objectPosition: '70% center' }} />
      </div>
      <div style={{ position: 'absolute', left: 610, top: 0, width: 18, height: 630, background: '#164e3d', display: 'flex' }} />
      <div style={{ width: 620, padding: '53px 48px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: '#50846b' }}>TAXI MATE</div>
        <div style={{ display: 'flex', fontSize: 72, marginTop: 27, lineHeight: 1.3, letterSpacing: -3 }}>택시메이트</div>
        <div style={{ display: 'flex', fontSize: 29, marginTop: 22 }}>학교 가는 길, 함께 타요.</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 33, fontSize: 25, lineHeight: 1.7 }}>
          <div style={{ display: 'flex', color: '#45705d' }}>어천역 · 초지역 출발</div>
          <div style={{ display: 'flex' }}>→ 화성의과학대학교</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 31, fontSize: 22 }}>
          <div style={{ display: 'flex', padding: '13px 17px', border: '3px solid #164e3d', background: '#ffdf7d' }}>정원 4명</div>
          <div style={{ display: 'flex', padding: '13px 17px', border: '3px solid #164e3d', background: '#ffffff' }}>최대 10분 대기</div>
        </div>
        <div style={{ display: 'flex', fontSize: 20, color: '#50846b', marginTop: 27 }}>비회원도 바로 이용할 수 있어요</div>
      </div>
      <div style={{ display: 'flex', position: 'absolute', right: 45, top: 40, background: '#f7f7e9', border: '4px solid #164e3d', padding: '15px 23px', fontSize: 25 }}>같이 가자!</div>
      <img src={`data:image/png;base64,${mascotData}`} alt="" width={250} height={250} style={{ position: 'absolute', right: 37, bottom: 20, objectFit: 'contain' }} />
      <div style={{ display: 'flex', position: 'absolute', left: 0, bottom: 0, width: '100%', height: 12, background: '#164e3d' }} />
    </div>,
    { ...size, fonts: [{ name: 'Galmuri', data: fontData, weight: 700, style: 'normal' }] },
  );
}
