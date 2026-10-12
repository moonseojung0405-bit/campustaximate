import { visitorId } from '../../visitor';
import { isSameOrigin } from '../../request-origin';
import { getRawDb } from '../../../db';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
const reply = (data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const nickname=z.string().trim().min(2).max(16);
const create=z.object({action:z.literal('create'),station:z.enum(['어천역','초지역']),departure:z.number().int(),place:z.string().trim().min(2).max(80),capacity:z.literal(4),fare:z.number().int().min(1000).max(200000).nullable(),note:z.string().trim().max(240),nickname});
const change=z.object({action:z.enum(['join','leave','cancel','message']),id:z.string().uuid(),nickname:nickname.optional(),body:z.string().trim().min(1).max(500).optional()});
export async function GET(request:Request) {
 try {
  const db=getRawDb(),user=await visitorId(request),url=new URL(request.url),id=url.searchParams.get('id');
  if(id){
   if(!user) return reply({error:'연결이 만료되었어요. 새로고침해 주세요.'},401);
   const ride=await db.prepare('SELECT id,station,departure,place,capacity,fare,note,status,host = ? AS owner FROM rides WHERE id = ?').bind(user,id).first();
   if(!ride) return reply({error:'모임을 찾을 수 없어요.'},404);
   const member=await db.prepare('SELECT nickname FROM members WHERE ride_id = ? AND user_id = ?').bind(id,user).first();
   if(!member) return reply({error:'참여자만 채팅을 볼 수 있어요.'},403);
   const results=await db.batch([db.prepare('SELECT nickname, user_id = ? AS me FROM members WHERE ride_id = ? ORDER BY joined').bind(user,id),db.prepare('SELECT id,nickname,body,created,user_id = ? AS me FROM messages WHERE ride_id = ? ORDER BY created DESC,id DESC LIMIT 100').bind(user,id)]);
   return reply({ride,members:results[0].results,messages:results[1].results.reverse()});
  }
  const mine=url.searchParams.get('mine')==='1',station=url.searchParams.get('station')||'어천역';
  if(!['어천역','초지역'].includes(station)) return reply({error:'출발역을 확인해 주세요.'},400);
  if(mine&&!user) return reply({error:'연결이 만료되었어요. 새로고침해 주세요.'},401);
  const now=Date.now();
  const query=`SELECT r.id,r.station,r.departure,r.place,r.capacity,r.fare,r.note,r.status,r.host = ? AS owner,(SELECT nickname FROM members WHERE ride_id=r.id AND user_id=r.host) AS "hostName",(SELECT COUNT(*) FROM members WHERE ride_id=r.id) AS count,EXISTS(SELECT 1 FROM members WHERE ride_id=r.id AND user_id=?) AS joined FROM rides r WHERE ${mine?'EXISTS(SELECT 1 FROM members WHERE ride_id=r.id AND user_id=?) AND r.departure > ?':"r.station=? AND r.departure > ? AND r.status='open'"} ORDER BY r.departure LIMIT 100`;
  const result=await db.prepare(query).bind(user??'',user??'',mine?user!:station,mine?now-7*86400000:now).all();
  return reply({rides:result.results});
 } catch(e){console.error('rides read failed',e);return reply({error:'모임을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'},503);}
}
export async function POST(request:Request){
 try{
  if(!isSameOrigin(request)) return reply({error:'요청 출처를 확인할 수 없어요.'},403);
  const user=await visitorId(request);if(!user)return reply({error:'연결이 만료되었어요. 새로고침해 주세요.'},401);
  const raw=await request.text();if(raw.length>4096)return reply({error:'입력 내용이 너무 길어요.'},400);
  let json;try{json=JSON.parse(raw);}catch{return reply({error:'입력 내용을 확인해 주세요.'},400);}
  const parsed=z.union([create,change]).safeParse(json);if(!parsed.success)return reply({error:'입력 내용을 확인해 주세요. 닉네임은 2~16자예요.'},400);
  const data=parsed.data,db=getRawDb(),now=Date.now(),uid=user;
  if(data.action==='create'){
   if(data.departure<=now||data.departure>now+7*86400000)return reply({error:'지금부터 7일 이내의 출발 시간을 선택해 주세요.'},400);
   const recent=await db.prepare('SELECT COUNT(*) AS n FROM rides WHERE host=? AND created>?').bind(uid,now-3600000).first<{n:number}>();
   if((recent?.n??0)>=10)return reply({error:'모집을 여러 번 등록했어요. 잠시 후 다시 이용해 주세요.'},429);
   const id=crypto.randomUUID();
   await db.batch([db.prepare('INSERT INTO rides(id,host,station,departure,place,capacity,fare,note,created) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,uid,data.station,data.departure,data.place,data.capacity,data.fare,data.note,now),db.prepare('INSERT INTO members(ride_id,user_id,nickname,joined) VALUES(?,?,?,?)').bind(id,uid,data.nickname,now)]);
   return reply({id},201);
  }
  const ride=await db.prepare('SELECT host,status,departure FROM rides WHERE id=?').bind(data.id).first<{host:string,status:string,departure:number}>();
  if(!ride)return reply({error:'모임을 찾을 수 없어요.'},404);
  if(data.action==='join'){
   if(!data.nickname)return reply({error:'모임에서 쓸 닉네임을 입력해 주세요.'},400);
   const inserted=await db.prepare("INSERT INTO members(ride_id,user_id,nickname,joined) SELECT id,?,?,? FROM rides WHERE id=? AND status='open' AND departure>? AND (SELECT COUNT(*) FROM members WHERE ride_id=rides.id)<capacity ON CONFLICT DO NOTHING").bind(uid,data.nickname,now,data.id,now).runLocked(data.id);
   if(!inserted.meta.changes){
    const member=await db.prepare('SELECT 1 FROM members WHERE ride_id=? AND user_id=?').bind(data.id,uid).first();
    if(!member)return reply({error:'정원이 찼거나 모집이 끝났어요. 다른 모임을 선택해 주세요.'},409);
   }
  }else if(data.action==='leave'){
   if(ride.host===uid)return reply({error:'모집자는 모임 취소를 이용해 주세요.'},400);
   await db.prepare('DELETE FROM members WHERE ride_id=? AND user_id=?').bind(data.id,uid).runLocked(data.id);
  }else if(data.action==='cancel'){
   if(ride.host!==uid)return reply({error:'모집자만 취소할 수 있어요.'},403);
   await db.prepare("UPDATE rides SET status='cancelled' WHERE id=? AND host=?").bind(data.id,uid).runLocked(data.id);
  }else{
   if(!data.body)return reply({error:'메시지를 입력해 주세요.'},400);
   const member=await db.prepare('SELECT nickname FROM members WHERE ride_id=? AND user_id=?').bind(data.id,uid).first<{nickname:string}>();
   if(!member)return reply({error:'참여자만 메시지를 보낼 수 있어요.'},403);
   if(ride.status!=='open'||ride.departure<now-86400000)return reply({error:'종료된 모임에는 메시지를 보낼 수 없어요.'},409);
   const recent=await db.prepare('SELECT COUNT(*) AS n FROM messages WHERE ride_id=? AND user_id=? AND created>?').bind(data.id,uid,now-60000).first<{n:number}>();
   if((recent?.n??0)>=20)return reply({error:'메시지를 너무 빠르게 보냈어요. 잠시만 기다려 주세요.'},429);
   await db.prepare('INSERT INTO messages(id,ride_id,user_id,nickname,body,created) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),data.id,uid,member.nickname,data.body,now).run();
  }
  return reply({ok:true});
 }catch(e){console.error('rides write failed',e);return reply({error:'저장하지 못했어요. 입력 내용은 유지되니 잠시 후 다시 시도해 주세요.'},503);}
}



