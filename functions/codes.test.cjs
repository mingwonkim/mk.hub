'use strict';
// 복구 코드·기기 추가 코드: 최근 인증해야 만듦, 일회용, 만료, 대소문자·하이픈 무시
const test=require('node:test'),assert=require('node:assert');
const {codes}=require('./codes');

function fakeDb(){
 const store=new Map();
 const ref=path=>({path,get:async()=>({exists:store.has(path),data:()=>store.get(path)}),set:async v=>{store.set(path,v);},update:async v=>{store.set(path,{...store.get(path),...v});}});
 return{store,doc:ref,
  collection:col=>({doc:id=>ref(col+'/'+id),where:()=>({limit:()=>({get:async()=>({docs:[]})})})}),
  runTransaction:async fn=>fn({get:r=>r.get(),update:(r,v)=>{store.set(r.path,{...store.get(r.path),...v});}}),
 };
}
const now={vault_access:true,vault_pin_at:Date.now(),vault_version:3},old={vault_access:true,vault_pin_at:Date.now()-6*60*1000,vault_version:3},P='pepper',V=3;

test('복구 코드: 최근 인증 필요, 8개, 한 번만',async()=>{
 const c=codes(fakeDb());
 await assert.rejects(c.recoveryCreate(old,P),/다시 인증/);
 const {codes:list}=await c.recoveryCreate(now,P);
 assert.equal(list.length,8);assert.match(list[0],/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
 assert.deepEqual(await c.use(list[0].toLowerCase().replace('-',' '),P,V),{kind:'recovery'}); // 소문자·공백도 됨
 await assert.rejects(c.use(list[0],P,V),/이미 썼거나/);
 assert.deepEqual(await c.recoveryStatus(V),{created:(await c.recoveryStatus(V)).created,left:7,valid:true});
 await assert.rejects(c.use(list[1],P,V+1),/코드가 맞지 않거나/); // 모든 기기 로그아웃·패턴 변경(version 증가) 뒤엔 무효
 assert.equal((await c.recoveryStatus(V+1)).valid,false);
 const again=await c.recoveryCreate(now,P);await assert.rejects(c.use(list[1],P,V),/코드가 맞지 않거나/); // 새로 만들면 옛 코드 무효
 assert.ok(again.codes.length===8);
});

test('기기 추가 코드: 최근 인증 필요, 한 번만, 10분 지나면 무효',async()=>{
 const db=fakeDb(),c=codes(db);
 await assert.rejects(c.pairCreate(old,P),/다시 인증/);
 const {code}=await c.pairCreate(now,P);assert.match(code,/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
 await assert.rejects(c.use(code,P,V+1),/코드가 맞지 않거나/); // version 바뀌면 무효(소비 안 됨)
 assert.deepEqual(await c.use(code,P,V),{kind:'pair'});
 await assert.rejects(c.use(code,P,V),/이미 썼거나/);
 const late=await c.pairCreate(now,P);
 for(const [k,v] of db.store)if(k.includes('/pairs/')&&!v.used)v.expires=Date.now()-1;
 await assert.rejects(c.use(late.code,P,V),/시간이 지났습니다/);
 await assert.rejects(c.use('ZZZZ-ZZZZ',P,V),/코드가 맞지 않거나/);
});
