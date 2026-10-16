'use strict';
// Face ID / 패스키(WebAuthn). 등록은 방금 패턴(또는 패스키)으로 연 소유자만, 로그인은 누구나 시도 가능(서명 검증 + 빈도 제한).
// 성공하면 패턴 통과와 같은 저장고 토큰을 발급(index.js mint). 패턴·이메일 복구는 예비 수단으로 그대로 둠.
const {randomBytes}=require('node:crypto');
const {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse}=require('@simplewebauthn/server');
const {VaultError,REAUTH_MS}=require('./security');
const RP_ID='xn--zf0bu7y.com',ORIGIN='https://'+RP_ID,CHALLENGE_MS=5*60*1000;
const b64=u8=>Buffer.from(u8).toString('base64url'),u8=s=>new Uint8Array(Buffer.from(s,'base64url'));
const fresh=claims=>claims.vault_access===true&&Date.now()-claims.vault_pin_at<REAUTH_MS; // 등록·삭제는 최근 5분 안에 다시 연 경우만

function passkeys(db){
 const keys=db.collection('mk_security/webauthn/passkeys'),challenges=db.collection('mk_security/webauthn/challenges');
 async function saveChallenge(kind,challenge){
  const id=randomBytes(16).toString('hex'),now=Date.now();await challenges.doc(id).set({kind,challenge,expires:now+CHALLENGE_MS});
  challenges.where('expires','<',now).limit(20).get().then(old=>Promise.all(old.docs.map(d=>d.ref.delete()))).catch(()=>{}); // 안 쓰고 만료된 것 정리
  return id;
 }
 // 한 번만 쓸 수 있음: 만료·종류가 틀려도 꺼내는 순간 지움(트랜잭션 안에서 throw하면 삭제도 취소되므로 판정은 밖에서). 만료는 TTL 아닌 여기서 판정
 async function takeChallenge(id,kind){
  if(typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id))throw new VaultError(400,'Try again.');
  const c=await db.runTransaction(async tx=>{const ref=challenges.doc(id),snap=await tx.get(ref);if(!snap.exists)return null;const data=snap.data();tx.delete(ref);return data;});
  if(!c)throw new VaultError(400,'Try again.');
  if(c.kind!==kind||c.expires<Date.now())throw new VaultError(400,'Timed out. Try again.');
  return c.challenge;
 }
 const credId=body=>{const id=body?.response?.id;if(typeof id!=='string'||!/^[\w-]{16,1024}$/.test(id))throw new VaultError(400,'Check the passkey response.');return id;};
 return{
  // 등록(로그인된 소유자, 최근 5분 안에 패턴/패스키로 연 경우만)
  async registerOptions(claims){
   if(!fresh(claims))throw new VaultError(401,'Verify again before registering.');
   const existing=await keys.get();
   const options=await generateRegistrationOptions({rpName:'민권.com',rpID:RP_ID,userName:'민권',userDisplayName:'민권',userID:new TextEncoder().encode(claims.uid),attestationType:'none',
    excludeCredentials:existing.docs.map(d=>({id:d.id,transports:d.data().transports||[]})),authenticatorSelection:{residentKey:'preferred',userVerification:'required'}});
   return{options,challengeId:await saveChallenge('reg',options.challenge)};
  },
  async registerVerify(claims,body){
   if(!fresh(claims))throw new VaultError(401,'Verify again before registering.');
   credId(body);const expectedChallenge=await takeChallenge(body.challengeId,'reg');
   let result;try{result=await verifyRegistrationResponse({response:body.response,expectedChallenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true});}catch(e){throw new VaultError(400,'Couldn\'t verify the passkey.');}
   if(!result.verified)throw new VaultError(400,'Couldn\'t verify the passkey.');
   const c=result.registrationInfo.credential,label=String(body.label||'This device').slice(0,40);
   await keys.doc(c.id).set({publicKey:b64(c.publicKey),counter:c.counter,transports:c.transports||[],label,created:Date.now(),used:0});
   return{id:c.id,label};
  },
  // 로그인(인증 전). 저장된 패스키만 허용
  async loginOptions(){
   const existing=await keys.get();if(existing.empty)throw new VaultError(409,'No Face ID is registered.');
   const options=await generateAuthenticationOptions({rpID:RP_ID,userVerification:'required',allowCredentials:existing.docs.map(d=>({id:d.id,transports:d.data().transports||[]}))});
   return{options,challengeId:await saveChallenge('auth',options.challenge)};
  },
  async loginVerify(body){
   const id=credId(body),expectedChallenge=await takeChallenge(body.challengeId,'auth');
   const ref=keys.doc(id),snap=await ref.get();if(!snap.exists)throw new VaultError(403,'This passkey is not registered.');
   const k=snap.data();
   let result;try{result=await verifyAuthenticationResponse({response:body.response,expectedChallenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true,credential:{id,publicKey:u8(k.publicKey),counter:k.counter||0,transports:k.transports||[]}});}catch(e){throw new VaultError(403,'Couldn\'t verify Face ID.');}
   if(!result.verified)throw new VaultError(403,'Couldn\'t verify Face ID.');
   // 동시 로그인: 검증에 쓴 counter가 그새 앞질러졌으면 거부(되돌리지 않음). Apple 패스키는 counter가 늘 0
   const next=result.authenticationInfo.newCounter;
   await db.runTransaction(async tx=>{const cur=(await tx.get(ref)).data();if(!cur)throw new VaultError(403,'This passkey is not registered.');if((cur.counter||0)!==(k.counter||0))throw new VaultError(409,'Signed in twice at once. Try again.');tx.update(ref,{counter:next,used:Date.now()});});
  },
  async list(){return{keys:(await keys.get()).docs.map(d=>({id:d.id,label:d.data().label,created:d.data().created,used:d.data().used||0}))};},
  async remove(claims,id){if(!fresh(claims))throw new VaultError(401,'Verify again before removing.');if(typeof id!=='string'||!/^[\w-]{16,1024}$/.test(id))throw new VaultError(400,'Invalid request.');await keys.doc(id).delete();return{ok:true};},
 };
}
module.exports={passkeys,RP_ID,ORIGIN};
