import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const sql=neon(process.env.DATABASE_URL);
const run='qa_'+Date.now().toString(36), pin='0736';
const userIds=new Set(),rideIds=new Set(),tokenHashes=new Set(),attemptKeys=new Set();
const hash=value=>createHash('sha256').update(value).digest('hex');
function client(initial=new Map()) {
 const jar=new Map(initial);
 return {jar,async call(path,body,origin=base){
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...(body?{Origin:origin,'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  for(const cookie of response.headers.getSetCookie()){
   const pair=cookie.split(';')[0],i=pair.indexOf('='),name=pair.slice(0,i),value=pair.slice(i+1);jar.set(name,value);
   if(name==='campus_taxi_visitor' && value)userIds.add(hash(value));
   if(name==='campus_taxi_account' && value)tokenHashes.add(hash(value));
  }
  const data=await response.json();
  if(body?.action==='create' && response.status===201)rideIds.add(data.id);
  return {status:response.status,data,headers:response.headers};
 }};
}
const host=client(),guest=client(),outsider=client();
const draft={action:'create',station:'어천역',departure:Date.now()+3600000,place:'자동 검증용 · 실제 모집 아님',capacity:4,fare:20000,note:run,nickname:'검증모집자'};
try {
 for(const c of [host,guest,outsider])assert.equal((await c.call('/api/session')).status,200);
 assert.equal((await client().call('/api/rides',draft)).status,401);
 assert.equal((await host.call('/api/rides',draft,'https://other.example')).status,403);
 assert.equal((await host.call('/api/rides',{...draft,capacity:3})).status,400);
 assert.equal((await host.call('/api/rides',{...draft,station:'다른역'})).status,400);
 const created=await host.call('/api/rides',draft);assert.equal(created.status,201,JSON.stringify(created.data));const id=created.data.id;
 assert.equal((await guest.call('/api/rides',{action:'join',id,nickname:'검증참여자'})).status,200);
 assert.equal((await guest.call('/api/rides',{action:'message',id,body:'5분 정도 늦어요.'})).status,200);
 assert.equal((await outsider.call('/api/rides?id='+id)).status,403);
 assert.equal((await outsider.call('/api/rides',{action:'message',id,body:'외부 메시지'})).status,403);
 assert.equal((await guest.call('/api/rides',{action:'cancel',id})).status,403);
 const reopened=client(host.jar);assert.equal((await reopened.call('/api/session')).data.legacyRecords,true);
 const detail=await reopened.call('/api/rides?id='+id);assert.equal(detail.data.ride.owner,1);assert.equal(typeof detail.data.ride.departure,'number');assert.equal(detail.data.messages[0].body,'5분 정도 늦어요.');
 const joiners=Array.from({length:6},()=>client());
 await Promise.all(joiners.map(c=>c.call('/api/session')));
 const joins=await Promise.all(joiners.map(c=>c.call('/api/rides',{action:'join',id,nickname:'동시참여'})));
 assert.equal(joins.filter(r=>r.status===200).length,2,'Only two remaining seats admitted');
 assert.equal(joins.filter(r=>r.status===409).length,4);
 assert.equal((await host.call('/api/rides?id='+id)).data.members.length,4);
 assert.equal((await guest.call('/api/rides',{action:'join',id,nickname:'중복참여'})).status,200);
 const staleGuest=client(host.jar),username=run;
 attemptKeys.add('name:'+hash(username));
 assert.equal((await host.call('/api/session',{action:'register',username,pin:'12',confirmPin:'12'})).status,400);
 assert.equal((await host.call('/api/session',{action:'register',username,pin,confirmPin:'9999'})).status,400);
 assert.equal((await host.call('/api/session',{action:'register',username,pin,confirmPin:pin})).status,201);
 const [account]=await sql.query('SELECT id,pin_hash FROM accounts WHERE username=$1',[username]);userIds.add(account.id);
 assert.equal(account.pin_hash.length,64);assert.notEqual(account.pin_hash,pin);
 assert.equal((await staleGuest.call('/api/rides',{action:'cancel',id})).status,401);
 assert.equal((await outsider.call('/api/session',{action:'register',username:username.toUpperCase(),pin,confirmPin:pin})).status,409);
 const other=client();
 assert.equal((await other.call('/api/session',{action:'login',username,pin:'9999'})).status,401);
 assert.equal((await other.call('/api/session',{action:'login',username:username.toUpperCase(),pin})).status,200);
 assert.equal((await other.call('/api/rides?mine=1')).data.rides.find(r=>r.id===id).owner,1);
 assert.equal((await other.call('/api/rides',{action:'message',id,body:'가입 후 다른 기기'})).status,200);
 const oldAccountCookie=client(host.jar);
 assert.equal((await host.call('/api/session',{action:'logout'})).status,200);
 assert.equal((await oldAccountCookie.call('/api/rides?id='+id)).status,401);
 assert.equal((await other.call('/api/rides?id='+id)).data.messages.at(-1).body,'가입 후 다른 기기');
 for(let i=0;i<10;i++)assert.equal((await outsider.call('/api/session',{action:'login',username,pin:'9999'})).status,401);
 assert.equal((await outsider.call('/api/session',{action:'login',username,pin:'9999'})).status,429);
 await sql.query('UPDATE auth_attempts SET expires=0 WHERE key=$1',['name:'+hash(username)]);
 assert.equal((await outsider.call('/api/session',{action:'login',username,pin})).status,200);
 assert.equal((await guest.call('/api/rides',{action:'leave',id})).status,200);
 assert.equal((await guest.call('/api/rides?id='+id)).status,403);
 const rejected=joiners[joins.findIndex(result=>result.status===409)];
 assert.equal((await rejected.call('/api/rides',{action:'join',id,nickname:'빈자리참여'})).status,200);
 assert.equal((await other.call('/api/rides',{action:'cancel',id})).status,200);
 assert.equal((await rejected.call('/api/rides',{action:'message',id,body:'취소 후'})).status,409);
 const guestRide=await guest.call('/api/rides',{...draft,station:'초지역'});assert.equal(guestRide.status,201);
 assert.equal((await guest.call('/api/rides',{action:'cancel',id:guestRide.data.id})).status,200);
 console.log('PASS: PostgreSQL persistence, guest access, signup/login/logout, PIN checks, cross-device ownership, CSRF, concurrent four-seat limit, private chat and cancellation.');
} finally {
 // Remove only this run's exact IDs, including sessions created on other clients.
 await sql.transaction([
  sql.query('DELETE FROM rides WHERE id=ANY($1::text[])',[[...rideIds]]),
  sql.query('DELETE FROM account_sessions WHERE account_id=ANY($1::text[]) OR token_hash=ANY($2::text[])',[[...userIds],[...tokenHashes]]),
  sql.query('DELETE FROM accounts WHERE id=ANY($1::text[])',[[...userIds]]),
  sql.query('DELETE FROM visitors WHERE id=ANY($1::text[])',[[...userIds]]),
  sql.query('DELETE FROM auth_attempts WHERE key=ANY($1::text[])',[[...attemptKeys]]),
 ]);
 console.log('Verification records removed.');
}
