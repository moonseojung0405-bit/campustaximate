import { getRawDb } from '../db';
export const COOKIE='campus_taxi_visitor';
export async function visitorId(request:Request){
 const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await hashToken(token);
 const row=await getRawDb().prepare('SELECT id FROM visitors WHERE id=? AND expires>?').bind(hash,Date.now()).first<{id:string}>();
 return row?.id??null;
}
export async function hashToken(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
