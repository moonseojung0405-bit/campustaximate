import { getRawDb } from '../../../db';
import { COOKIE, visitorId, hashToken } from '../../visitor';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  if(await visitorId(request))return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  await getRawDb().prepare('INSERT INTO visitors(id,expires) VALUES(?,?)').bind(await hashToken(token),Date.now()+180*86400000).run();
  return Response.json({ready:true},{headers:{'Cache-Control':'no-store','Set-Cookie':`${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=15552000${new URL(request.url).protocol==='https:'?'; Secure':''}`}});
 }catch(e){console.error('visitor initialization failed',e);return Response.json({error:'연결을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
