import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const jars=new Map();
async function cookie(user){if(!user)return '';if(!jars.has(user)){const r=await fetch(base+'/api/session');assert.equal(r.status,200);jars.set(user,r.headers.get('set-cookie').split(';')[0]);}return jars.get(user);}
async function request(user,body,path='/api/rides',origin=base){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:await cookie(user),...(body?{'Content-Type':'application/json','Origin':origin}:{})},body:body?JSON.stringify(body):undefined});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return {status:r.status,data};}
const host='verify-'+Date.now(),future=Date.now()+3600000;
const draft={action:'create',station:'어천역',departure:future,place:'테스트 모임 · 실제 모집 아님',capacity:4,fare:20000,note:'로컬 검증용',nickname:'테스트모집자'};
assert.equal((await request(null,draft)).status,401);
assert.equal((await request(host,draft,'/api/rides','https://other.example')).status,403);
assert.equal((await request(host,{...draft,capacity:3})).status,400);
assert.equal((await request(host,{...draft,station:'다른역'})).status,400);
assert.equal((await request(host,{...draft,departure:Date.now()-1000})).status,400);
const created=await request(host,draft);assert.equal(created.status,201,JSON.stringify(created));const id=created.data.id;
try {
 const joiners=Array.from({length:6},(_,i)=>host+'-guest'+i);
 const results=await Promise.all(joiners.map(user=>request(user,{action:'join',id,nickname:'참여학우'})));
 assert.equal(results.filter(r=>r.status===200).length,3,'Exactly three guests admitted concurrently');
 assert.equal(results.filter(r=>r.status===409).length,3);
 const accepted=joiners.filter((_,i)=>results[i].status===200),rejected=joiners.find((_,i)=>results[i].status===409);
 const details=await request(host,null,'/api/rides?id='+id);assert.equal(details.data.members.length,4);
 assert.equal((await request(accepted[0],{action:'join',id,nickname:'다시참여'})).status,200);
 assert.equal((await request(rejected,null,'/api/rides?id='+id)).status,403);
 assert.equal((await request(rejected,{action:'message',id,body:'외부 메시지'})).status,403);
 assert.equal((await request(accepted[0],{action:'cancel',id})).status,403);
 assert.equal((await request(accepted[0],{action:'message',id,body:'5분 정도 늦어요.'})).status,200);
 const messages=await request(host,null,'/api/rides?id='+id);assert.equal(messages.data.messages[0].body,'5분 정도 늦어요.');
 assert.equal((await request(accepted[0],{action:'leave',id})).status,200);
 assert.equal((await request(accepted[0],null,'/api/rides?id='+id)).status,403);
 assert.equal((await request(rejected,{action:'join',id,nickname:'새로운학우'})).status,200);
 assert.equal((await request(host,null,'/api/rides?station='+encodeURIComponent('초지역'))).data.rides.some(r=>r.id===id),false);
 assert.equal((await request(host,{action:'cancel',id})).status,200);
 assert.equal((await request(host,{action:'message',id,body:'종료 메시지'})).status,409);
 assert.equal((await request(host+'-late',{action:'join',id,nickname:'지각학우'})).status,409);
 console.log('PASS: auth, CSRF, fixed capacity, stations, past date, concurrent 4-seat limit, idempotency, chat isolation/persistence, ownership, leave/rejoin, cancellation.');
}finally{await request(host,{action:'cancel',id});}


