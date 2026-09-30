import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '학교 같이타 | 화성의과학대 택시 동승', description: '어천역·초지역에서 화성의과학대학교까지, 같은 시간에 가는 학우와 택시를 함께 타세요.', icons: {icon:'/favicon.svg'} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="ko"><body>{children}</body></html>}
