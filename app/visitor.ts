import { getRawDb } from '../db';
export const COOKIE='campus_taxi_visitor';
export const ACCOUNT_COOKIE='campus_taxi_account';
export function readToken(request:Request,name:string){const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');}
export function sessionCookie(request:Request,name:string,token:string,maxAge=15552000){return `${name}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export async function accountSession(request:Request){
 const token=readToken(request,ACCOUNT_COOKIE);if(!token)return null;
 return getRawDb().prepare('SELECT a.id,a.username FROM account_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?').bind(await hashToken(token),Date.now()).first<{id:string;username:string}>();
}
export async function legacyVisitorId(request:Request){
 const token=readToken(request,COOKIE);if(!token)return null;
 const row=await getRawDb().prepare('SELECT id FROM visitors WHERE id=? AND expires>? AND NOT EXISTS(SELECT 1 FROM accounts WHERE accounts.id=visitors.id)').bind(await hashToken(token),Date.now()).first<{id:string}>();return row?.id??null;
}
export async function visitorId(request:Request){return (await accountSession(request))?.id??await legacyVisitorId(request);}
export async function hashToken(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
export async function derivePin(pin:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,'0')).join('');}
export function equalHash(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<64;i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export async function reserveAttempt(key:string,max:number,windowMs:number){const now=Date.now();const row=await getRawDb().prepare('INSERT INTO auth_attempts(key,attempts,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING attempts,expires').bind(key,now+windowMs,now,now).first<{attempts:number;expires:number}>();return row&&row.attempts>max?Math.max(1,Math.ceil((row.expires-now)/1000)):0;}
