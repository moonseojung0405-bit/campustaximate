'use client';
import Image from 'next/image';
import { useState } from 'react';

export function PixelTaxi({className='',moving=false,sizes='112px'}:{className?:string;moving?:boolean;sizes?:string}) {
 return <span className={`pixel-taxi ${moving?'taxi-idle':''} ${className}`} aria-hidden="true"><Image src="/art/taxi-mascot.png" alt="" width={1536} height={1024} sizes={sizes}/></span>;
}

export function CampusHero() {
 const [paused,setPaused]=useState(false);
 return <section className={`campus-hero ${paused?'hero-motion-paused':''}`} aria-labelledby="campus-title">
  <div className="hero-copy">
   <span className="hero-label"><span/>같은 방향, 우리들의 등굣길</span>
   <h1 id="campus-title">오늘도,<br/> <em>학교 같이 가요.</em></h1>
   <p>어천역·초지역에서 학교까지.<br/> 함께 타고, 택시비는 가볍게.</p>
   <div className="hero-chips"><span>정원 4명</span><span>최대 10분 대기</span><span>비회원도 OK</span></div>
  </div>
  <div className="hero-scene">
   <Image className="campus-landscape" src="/art/campus-journey.png" alt="" fill sizes="(max-width: 700px) 100vw, 650px" preload/>
   <span className="campus-pin" aria-hidden="true"><span/>우리의 목적지는 학교!</span>
   <div className="hero-taxi" aria-hidden="true"><PixelTaxi moving sizes="180px"/></div>
   <button className="motion-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'▶ 움직임 재생':'Ⅱ 움직임 멈추기'}</button>
   <span className="scene-caption" aria-hidden="true">NEXT STOP · CAMPUS</span>
  </div>
 </section>;
}

export function PixelLoader({label='모집을 불러오고 있어요…'}:{label?:string}) {
 return <div className="pixel-loader" role="status"><div className="loading-road"><PixelTaxi moving/><span/></div><p>{label}</p><span className="loading-dots" aria-hidden="true"><i/><i/><i/></span></div>;
}

export function PixelAvatar({name}:{name:string}) {
 const tone=Array.from(name).reduce((sum,char)=>sum+char.charCodeAt(0),0)%4;
 return <span className={`pixel-avatar avatar-tone-${tone}`} aria-hidden="true"><PixelTaxi sizes="40px"/></span>;
}
