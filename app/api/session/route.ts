import { getRawDb } from '../../../db';
import { isSameOrigin } from '../../request-origin';
import { COOKIE,ACCOUNT_COOKIE,accountSession,legacyVisitorId,hashToken,randomToken,sessionCookie,readToken,derivePin,equalHash,reserveAttempt } from '../../visitor';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...extra}});
export async function GET(request:Request){
 try{
  const account=await accountSession(request);if(account)return reply({ready:true,account:{username:account.username},legacyRecords:false});
  const legacy=await legacyVisitorId(request);
  if(legacy){const row=await getRawDb().prepare('SELECT EXISTS(SELECT 1 FROM members WHERE user_id=?) AS found').bind(legacy).first<{found:number}>();return reply({ready:true,account:null,legacyRecords:!!row?.found});}
  const token=randomToken();await getRawDb().prepare('INSERT INTO visitors(id,expires) VALUES(?,?)').bind(await hashToken(token),Date.now()+180*86400000).run();
  return reply({ready:true,account:null,legacyRecords:false},200,{'Set-Cookie':sessionCookie(request,COOKIE,token)});
 }catch{return reply({error:'연결을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.'},503);}
}
export async function POST(request:Request){
 try{
  if(!isSameOrigin(request))return reply({error:'요청 출처를 확인할 수 없어요.'},403);
  const text=await request.text();if(text.length>1024)return reply({error:'입력 내용을 확인해 주세요.'},400);
  let data;try{data=JSON.parse(text);}catch{return reply({error:'입력 내용을 확인해 주세요.'},400);}
  if(!data||typeof data!=='object')return reply({error:'입력 내용을 확인해 주세요.'},400);
  const db=getRawDb();
  if(data.action==='logout'){
   const token=readToken(request,ACCOUNT_COOKIE);if(token)await db.prepare('DELETE FROM account_sessions WHERE token_hash=?').bind(await hashToken(token)).run();
   const response=reply({ok:true});response.headers.append('Set-Cookie',sessionCookie(request,ACCOUNT_COOKIE,'',0));response.headers.append('Set-Cookie',sessionCookie(request,COOKIE,'',0));return response;
  }
  if(data.action!=='register'&&data.action!=='login')return reply({error:'잘못된 요청이에요.'},400);
  const username=typeof data.username==='string'?data.username.trim().toLowerCase():'';
  if(!/^[a-z0-9_]{4,20}$/.test(username)||typeof data.pin!=='string'||!/^\d{4}$/.test(data.pin))return reply({error:'아이디는 영문·숫자·밑줄 4~20자, 비밀번호는 숫자 4자리로 입력해 주세요.'},400);
  if(await accountSession(request))return reply({error:'이미 로그인되어 있어요. 다른 계정을 쓰려면 먼저 로그아웃해 주세요.'},409);
  const ip=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : null;
  if(ip){const delay=await reserveAttempt('ip:'+await hashToken(ip),60,15*60000);if(delay)return reply({error:'요청이 많아요. 잠시 후 다시 시도해 주세요.'},429,{'Retry-After':String(delay)});}
  let id:string;
  if(data.action==='register'){
   if(data.pin!==data.confirmPin)return reply({error:'비밀번호 확인이 일치하지 않아요.'},400);
   const old=await legacyVisitorId(request);id=old??crypto.randomUUID();
   const salt=randomToken(),pinHash=await derivePin(data.pin,salt);
   const result=await db.prepare('INSERT INTO accounts(id,username,pin_hash,salt,created) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING').bind(id,username,pinHash,salt,Date.now()).run();
   if(!result.meta.changes)return reply({error:'이미 사용 중인 아이디이거나 이 브라우저의 기록에 계정이 연결되어 있어요. 다른 아이디 또는 로그인을 이용해 주세요.'},409);
  }else{
   const key='name:'+await hashToken(username),delay=await reserveAttempt(key,10,15*60000);
   if(delay)return reply({error:'비밀번호를 여러 번 틀렸어요. 최대 15분 뒤 다시 시도해 주세요.'},429,{'Retry-After':String(delay)});
   const account=await db.prepare('SELECT id,pin_hash,salt FROM accounts WHERE username=?').bind(username).first<{id:string;pin_hash:string;salt:string}>();
   const candidate=await derivePin(data.pin,account?.salt??'campus-taxi-nonexistent-account');
   if(!account||!equalHash(candidate,account.pin_hash))return reply({error:'아이디 또는 비밀번호가 맞지 않아요.'},401);
   id=account.id;await db.prepare('DELETE FROM auth_attempts WHERE key=?').bind(key).run();
  }
  const token=randomToken();await db.prepare('INSERT INTO account_sessions(token_hash,account_id,expires) VALUES(?,?,?)').bind(await hashToken(token),id,Date.now()+180*86400000).run();
  const response=reply({account:{username}},data.action==='register'?201:200);response.headers.append('Set-Cookie',sessionCookie(request,ACCOUNT_COOKIE,token));response.headers.append('Set-Cookie',sessionCookie(request,COOKIE,'',0));return response;
 }catch{return reply({error:'계정 연결을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.'},503);}
}
