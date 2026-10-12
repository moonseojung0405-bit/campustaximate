import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
function client(cookies=new Map()) {
 return {cookies,async call(path,body){
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),...(body?{Origin:base,'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
  return {status:response.status,data:await response.json()};
 }};
}
const host=client(),guest=client(),stranger=client();
for(const user of [host,guest,stranger])assert.equal((await user.call('/api/session')).data.account,null);
const created=await host.call('/api/rides',{action:'create',station:'초지역',departure:Date.now()+3600000,place:'비회원 로컬 검증',capacity:4,fare:null,note:'로컬 테스트',nickname:'비회원모집자'});
assert.equal(created.status,201);
const id=created.data.id;
try {
 assert.equal((await guest.call('/api/rides',{action:'join',id,nickname:'비회원학우'})).status,200);
 assert.equal((await guest.call('/api/rides',{action:'message',id,body:'5분 정도 늦어요.'})).status,200);
 assert.equal((await stranger.call('/api/rides?id='+id)).status,403);
 assert.equal((await stranger.call('/api/rides',{action:'cancel',id})).status,403);
 assert.equal((await client().call('/api/rides',{action:'message',id,body:'세션 없음'})).status,401);
 const reopened=client(new Map(host.cookies));
 assert.equal((await reopened.call('/api/session')).data.legacyRecords,true);
 assert.equal((await reopened.call('/api/rides?mine=1')).data.rides.find(r=>r.id===id).owner,1);
 assert.equal((await reopened.call('/api/rides?id='+id)).data.messages[0].body,'5분 정도 늦어요.');
 const oldCookie=new Map(host.cookies),username='guest_'+Date.now().toString(36),pin='0824';
 assert.equal((await host.call('/api/session',{action:'register',username,pin,confirmPin:pin})).status,201);
 assert.equal((await client(oldCookie).call('/api/rides',{action:'cancel',id})).status,401);
 const otherDevice=client();
 assert.equal((await otherDevice.call('/api/session',{action:'login',username,pin})).status,200);
 assert.equal((await otherDevice.call('/api/rides?id='+id)).data.ride.owner,1);
 assert.equal((await otherDevice.call('/api/rides',{action:'message',id,body:'가입 후 다른 기기'})).status,200);
 assert.equal((await guest.call('/api/rides?id='+id)).data.messages.at(-1).body,'가입 후 다른 기기');
 assert.equal((await guest.call('/api/rides',{action:'leave',id})).status,200);
 assert.equal((await guest.call('/api/rides?id='+id)).status,403);
 const guestRide=await guest.call('/api/rides',{action:'create',station:'어천역',departure:Date.now()+3600000,place:'비회원 취소 검증',capacity:4,fare:null,note:'로컬 테스트',nickname:'비회원학우'});
 assert.equal(guestRide.status,201);
 assert.equal((await guest.call('/api/rides',{action:'cancel',id:guestRide.data.id})).status,200);
 console.log('PASS: guest create/join/chat/leave/cancel, persistent browser identity, participant privacy, guest-to-account record continuity, cross-device login, stale guest cookie denied.');
} finally {await host.call('/api/rides',{action:'cancel',id});}
