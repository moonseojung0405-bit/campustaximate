import type { Metadata } from 'next';
import './globals.css';

const title = '택시메이트 | 화성의과학대 택시 동승';
const description = '어천역·초지역에서 화성의과학대학교까지, 최대 4명이 택시를 함께 타요. 최대 10분 기다리고 채팅으로 만날 시간을 맞춰요. 비회원도 이용할 수 있어요.';

export const metadata: Metadata = {
  metadataBase: new URL('https://campustaximate.vercel.app'),
  title,
  description,
  applicationName: '택시메이트',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '택시메이트',
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="ko"><body>{children}</body></html>}
