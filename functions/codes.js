'use strict';
// 코드로 열기: ① 복구 코드(8개, 일회용, Face ID·패턴을 다 잃었을 때) ② 기기 추가 코드(10분, 일회용, 열린 기기에서 만들어 새 기기에 입력 → 그 기기에 Face ID 등록)
// 코드는 HMAC(pepper)로만 저장하고, 만든 때의 저장고 version에 묶음 → 모든 기기 로그아웃·패턴 변경(version 증가) 뒤엔 무효.
// 입력은 IP별 빈도 제한(전역 제한은 남이 일부러 소진해 주인을 막을 수 있어 두지 않음 — 코드가 40~50비트라 분산 추측도 비현실적).
const {randomInt,createHmac}=require('node:crypto');
const {VaultError,REAUTH_MS}=require('./security');
const ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O·1/I 뺌
const PAIR_MS=10*60*1000,RECOVERY_COUNT=8;
const make=n=>Array.from({length:n},()=>ABC[randomInt(ABC.length)]).join('');
const norm=code=>typeof code==='string'?code.toUpperCase().replace(/[^A-Z0-9]/g,''):'';
const fresh=claims=>claims.vault_access===true&&Date.now()-claims.vault_pin_at<REAUTH_MS;

function codes(db){
 const recoveryRef=db.doc('mk_security/recovery'),pairs=db.collection('mk_security/webauthn/pairs');
 const hash=(pepper,code)=>createHmac('sha256',pepper).update('code:'+code).digest('hex');
 return{
  // 복구 코드 새로 만들기(옛 코드는 전부 무효). 보여 주는 건 이번 한 번뿐
  async recoveryCreate(claims,pepper){
   if(!fresh(claims))throw new VaultError(401,'복구 코드를 만들기 전에 다시 인증해주세요.');
   const list=Array.from({length:RECOVERY_COUNT},()=>make(10));
   await recoveryRef.set({codes:list.map(c=>({h:hash(pepper,c),used:0})),created:Date.now(),version:claims.vault_version});
   return{codes:list.map(c=>c.slice(0,5)+'-'+c.slice(5))};
  },
  async recoveryStatus(version){const d=(await recoveryRef.get()).data();return{created:d?.created||0,left:d?d.codes.filter(c=>!c.used).length:0,valid:!!d&&d.version===version};},
  // 기기 추가 코드(열려 있는 기기에서)
  async pairCreate(claims,pepper){
   if(!fresh(claims))throw new VaultError(401,'기기 추가 코드를 만들기 전에 다시 인증해주세요.'); // 새 기기에 영구 출입을 주는 일이라 최근 인증만
   const code=make(8),now=Date.now();
   await pairs.doc(hash(pepper,code)).set({expires:now+PAIR_MS,used:0,version:claims.vault_version});
   pairs.where('expires','<',now).limit(20).get().then(old=>Promise.all(old.docs.map(d=>d.ref.delete()))).catch(()=>{});
   return{code:code.slice(0,4)+'-'+code.slice(4),expires:now+PAIR_MS};
  },
  // 코드 입력: 기기 추가 코드(8자) 또는 복구 코드(10자). 일회용 — 트랜잭션 안에서 판정·소비. version은 지금 저장고 version
  async use(code,pepper,version){
   const c=norm(code);
   if(c.length===8){
    const h=hash(pepper,c),ref=pairs.doc(h);
    const ok=await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)return false;const d=snap.data();if(d.used||d.expires<Date.now()||d.version!==version)return false;tx.update(ref,{used:Date.now()});return true;});
    if(ok)return{kind:'pair'};
   }else if(c.length===10){
    const h=hash(pepper,c);
    const ok=await db.runTransaction(async tx=>{const snap=await tx.get(recoveryRef);if(!snap.exists||snap.data().version!==version)return false;const list=snap.data().codes,i=list.findIndex(x=>x.h===h&&!x.used);if(i<0)return false;list[i]={...list[i],used:Date.now()};tx.update(recoveryRef,{codes:list});return true;});
    if(ok)return{kind:'recovery'};
   }
   throw new VaultError(403,'코드가 맞지 않거나 이미 썼거나 시간이 지났습니다.');
  },
 };
}
module.exports={codes,norm};
