'use strict';
// 패스키 서버 규칙: 오래된 인증으로 등록 금지, 챌린지 일회용·만료. (서명 검증 자체는 SimpleWebAuthn 몫 — 실기기로 확인)
const test=require('node:test'),assert=require('node:assert');
const {passkeys}=require('./passkey');

function fakeDb(){
 const store=new Map();
 const docRef=path=>({
  get:async()=>({exists:store.has(path),data:()=>store.get(path)}),
  set:async v=>{store.set(path,v);},update:async v=>{store.set(path,{...store.get(path),...v});},delete:async()=>{store.delete(path);},path,
 });
 return{store,
  collection:col=>({doc:id=>docRef(col+'/'+id),where:()=>({limit:()=>({get:async()=>({docs:[]})})}),get:async()=>{const docs=[...store].filter(([k])=>k.startsWith(col+'/')&&!k.slice(col.length+1).includes('/')).map(([k,v])=>({id:k.slice(col.length+1),data:()=>v}));return{docs,empty:!docs.length};}}),
  runTransaction:async fn=>fn({get:r=>r.get(),delete:r=>{store.delete(r.path);}}),
 };
}

test('등록은 최근 5분 안에 연 소유자만',async()=>{
 const pk=passkeys(fakeDb());
 await assert.rejects(pk.registerOptions({uid:'u',vault_access:true,vault_pin_at:Date.now()-6*60*1000}),/[Vv]erify again/);
 const r=await pk.registerOptions({uid:'u',vault_access:true,vault_pin_at:Date.now()});
 assert.equal(r.options.rp.id,'xn--zf0bu7y.com');assert.match(r.challengeId,/^[a-f0-9]{32}$/);
});

test('패스키 없으면 로그인 옵션 거부',async()=>{
 await assert.rejects(passkeys(fakeDb()).loginOptions(),/No Face ID is registered/);
});

test('챌린지는 한 번만, 만료되면 거부',async()=>{
 const db=fakeDb(),pk=passkeys(db);
 db.store.set('mk_security/webauthn/passkeys/'+'A'.repeat(22),{publicKey:'AA',counter:0,transports:[]});
 const {challengeId}=await pk.loginOptions();
 const body={challengeId,response:{id:'A'.repeat(22),rawId:'A'.repeat(22),type:'public-key',response:{}}};
 await assert.rejects(pk.loginVerify(body),/Couldn't verify Face ID/); // 첫 시도: 챌린지 소비 후 서명 검증 실패
 await assert.rejects(pk.loginVerify(body),/Try again/); // 같은 챌린지 재사용 불가
 const again=await pk.loginOptions();
 db.store.get('mk_security/webauthn/challenges/'+again.challengeId).expires=Date.now()-1;
 await assert.rejects(pk.loginVerify({...body,challengeId:again.challengeId}),/Timed out/);
 await assert.rejects(pk.loginVerify({...body,challengeId:again.challengeId}),/Try again/); // 만료돼도 꺼내면 소비됨
});

test('Face ID 지우기도 최근 5분 안에 연 경우만',async()=>{
 const db=fakeDb(),pk=passkeys(db),id='B'.repeat(22);db.store.set('mk_security/webauthn/passkeys/'+id,{});
 await assert.rejects(pk.remove({vault_access:true,vault_pin_at:Date.now()-6*60*1000},id),/[Vv]erify again/);
 await pk.remove({vault_access:true,vault_pin_at:Date.now()},id);assert.equal(db.store.has('mk_security/webauthn/passkeys/'+id),false);
});
