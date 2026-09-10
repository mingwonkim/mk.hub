'use strict';
const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret,defineString}=require('firebase-functions/params');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,Timestamp,FieldValue}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {OWNER_EMAIL,REAUTH_MS,VaultError,requireOwner,hashPasswords,verifyPasswords,consumeRate,otpHash}=require('./security');
initializeApp();
const db=getFirestore(),auth=getAuth(),accessRef=db.doc('mk_security/access');
const OTP_PEPPER=defineSecret('VAULT_OTP_PEPPER');
const AUTH_KEY=defineString('VAULT_FIREBASE_API_KEY',{default:'AIzaSyDWXJ1nIQIZXSMruwFhyoMSU3gf3omiyMc'});
async function emailAuth(action,body){
 const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+AUTH_KEY.value(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const result=await response.json();if(!response.ok)throw new VaultError(400,action==='sendOobCode'?'메일을 보내지 못했습니다. 잠시 후 다시 요청해주세요.':'링크가 만료됐거나 이미 사용됐습니다. 새 링크를 요청해주세요.');return result;
}
const options={serviceAccount:'mkhub-vault@mingwon-hub.iam.gserviceaccount.com',region:'asia-northeast3',maxInstances:3,memory:'256MiB',timeoutSeconds:60,cors:['https://xn--zf0bu7y.com','https://mingwonkim.github.io','https://mingwon-hub.web.app','https://mingwon-hub.firebaseapp.com','http://127.0.0.1:8766']};
async function authenticate(req,access=false){
 const match=/^Bearer (.+)$/.exec(req.get('authorization')||'');if(!match)throw new VaultError(401,'인증이 필요합니다.');
 let claims;try{claims=await auth.verifyIdToken(match[1],true);}catch(e){throw new VaultError(401,'인증이 만료됐습니다.');}
 requireOwner(claims,access);
 if(access){const state=await accessRef.get();if(!state.exists||state.data().version!==claims.vault_version)throw new VaultError(401,'다시 인증해주세요.');}
 return claims;
}
async function mint(claims,access,version){
 return auth.createCustomToken(claims.uid,{vault_owner:true,vault_access:access,vault_otp_at:claims.vault_otp_at,vault_version:version||0,vault_pin_at:access?Date.now():0,vault_recovery:!access});
}
function api(handler){return async(req,res)=>{
 res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.status(405).json({error:'POST only'});return;}
 if(!req.is('application/json')||(Number(req.get('content-length')||0)>32768||Buffer.byteLength(JSON.stringify(req.body||{}))>32768)){res.status(400).json({error:'잘못된 요청입니다.'});return;}
 try{res.json(await handler(req));}catch(error){res.status(error.status||500).json({error:error.status?error.message:'요청을 완료하지 못했습니다. 다시 시도해주세요.'});}
};}
async function vaultHandler(req){
 const body=req.body||{},action=body.action;
 if(action==='request-link'){
  const pepper=OTP_PEPPER.value(),now=Date.now();
  const ip=otpHash('ip',req.ip||'unknown',pepper),ipRef=db.doc('mk_security/rate/ips/'+ip),globalRef=db.doc('mk_security/mailRate');
  await db.runTransaction(async tx=>{
   const [ipSnap,globalSnap]=await Promise.all([tx.get(ipRef),tx.get(globalRef)]);
   tx.set(ipRef,{...consumeRate(ipSnap.data(),now,5,60000),expiresAt:Timestamp.fromMillis(now+3600000)});
   tx.set(globalRef,consumeRate(globalSnap.data(),now,10,60000));
  });
  await emailAuth('sendOobCode',{requestType:'EMAIL_SIGNIN',email:OWNER_EMAIL,continueUrl:'https://xn--zf0bu7y.com/?vault='+(body.mode==='recover'?'recover':'open'),canHandleCodeInApp:true});
  return{sent:true};
 }
 if(action==='complete-link'){
  if(typeof body.code!=='string'||!body.code||body.code.length>2048)throw new VaultError(400,'새 인증 링크를 요청해주세요.');
  const result=await emailAuth('signInWithEmailLink',{email:OWNER_EMAIL,oobCode:body.code});
  const verified=await auth.verifyIdToken(result.idToken,true);
  if(verified.email!==OWNER_EMAIL||verified.email_verified!==true)throw new VaultError(403,'소유자 이메일 인증이 필요합니다.');
  return{token:await mint({uid:verified.uid,vault_otp_at:Date.now()},false,0)};
 }
 const claims=await authenticate(req);
 if(action==='pin-state'){
  const state=await accessRef.get();return{configured:state.exists,stages:state.exists?state.data().passwords.length:1};
 }
 if(action==='set-pin'){
  const freshRecovery=claims.vault_recovery===true&&Date.now()-claims.vault_otp_at<REAUTH_MS;
  const freshPin=claims.vault_access===true&&Date.now()-claims.vault_pin_at<REAUTH_MS;
  if(!freshRecovery&&!freshPin)throw new VaultError(401,'암호 변경 전 다시 인증해주세요.');
  const passwords=await hashPasswords(body.passwords);
  const version=await db.runTransaction(async tx=>{const old=await tx.get(accessRef);if(!freshRecovery&&old.data()?.version!==claims.vault_version)throw new VaultError(401,'다시 인증해주세요.');const version=(old.data()?.version||0)+1;tx.set(accessRef,{passwords,version,attempts:0,lockedUntil:0});return version;});
  return{token:await mint(claims,true,version)};
 }
 if(action==='verify-pin'){
  // Reserve an attempt before expensive hashing; concurrent requests cannot bypass the limit.
  const state=await db.runTransaction(async tx=>{const snap=await tx.get(accessRef);if(!snap.exists)throw new VaultError(409,'저장고 암호를 먼저 등록해주세요.');const state=snap.data(),now=Date.now();if(state.lockedUntil>now)throw new VaultError(429,'인증 시도가 많습니다. 15분 후 다시 시도해주세요.');const attempts=state.lockedUntil?0:(state.attempts||0);tx.update(accessRef,{attempts:attempts+1,lockedUntil:attempts+1>=5?now+900000:0});return state;});
  if(!await verifyPasswords(body.passwords,state.passwords))throw new VaultError(403,'암호가 일치하지 않습니다.');
  await db.runTransaction(async tx=>{const latest=await tx.get(accessRef);if(latest.data()?.version!==state.version)throw new VaultError(401,'암호가 변경됐습니다. 다시 인증해주세요.');tx.update(accessRef,{attempts:0,lockedUntil:0});});
  return{token:await mint(claims,true,state.version)};
 }
 if(action==='logout-all'){
  await authenticate(req,true);await accessRef.update({version:FieldValue.increment(1)});await auth.revokeRefreshTokens(claims.uid);return{ok:true};
 }
 throw new VaultError(404,'지원하지 않는 요청입니다.');
}
exports.vault=onRequest({...options,secrets:[OTP_PEPPER]},api(vaultHandler));
module.exports._private={authenticate,api,options,vaultHandler};

// GitHub settings and credentials never come from browser requests.
const GITHUB_REPOSITORY=defineString('VAULT_GITHUB_REPOSITORY',{default:'mingwonkim/obsidian-vault'});
const GITHUB_PATH=defineString('VAULT_GITHUB_PATH',{default:''});
function noteSlug(value){return String(value||'').replace(/[^a-zA-Z0-9가-힣\-_ ]/g,'').replace(/\s+/g,'-').slice(0,60)||'Untitled';}
async function githubHandler(req){
 await authenticate(req,true);
 const repository=GITHUB_REPOSITORY.value(),base=GITHUB_PATH.value().replace(/^\/+|\/+$/g,'');
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository)||base.split('/').some(part=>part==='..'))throw new VaultError(503,'백업 연결을 준비 중입니다.');
 const root='https://api.github.com/repos/'+repository;
 async function github(path,method='GET',body){
  const response=await fetch(root+path,{method,headers:{Authorization:'Bearer '+process.env.VAULT_GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  if(response.status===404&&method==='GET')return null;
  if(!response.ok)throw new VaultError(502,'비공개 백업 연결에 실패했습니다.');return response.json();
 }
 const repo=await github('');if(!repo||repo.private!==true)throw new VaultError(503,'비공개 보관함 연결을 확인해주세요.');
 const body=req.body||{};
 if(body.action==='status')return{connected:true};
 async function pushNote(snapshot){
  const memo=snapshot.data(),folder=memo.folder?await db.doc('mk_app/data/folders/'+memo.folder).get():null;
  const path=[base,noteSlug(folder?.data()?.name||'Uncategorized'),noteSlug(memo.t)+'_'+snapshot.id.slice(0,6)+'.md'].filter(Boolean).join('/');
  const safeTitle=String(memo.t||'Untitled').replace(/[\r\n]/g,' ');
  let content='---\ntitle: '+JSON.stringify(safeTitle)+'\nmk_id: '+snapshot.id+'\ncreated: '+new Date(memo.c||Date.now()).toISOString()+'\nupdated: '+new Date(memo.u||Date.now()).toISOString()+'\n---\n\n'+(memo.type==='draw'?'':memo.b||'');
  // Private storage references carry no bearer download token into GitHub.
  if(memo.canvas_path||memo.type==='draw')content+='\n\n[그림 원본은 MK.HUB 개인 저장고에서 열기](https://xn--zf0bu7y.com/)';
  const endpoint='/contents/'+path.split('/').map(encodeURIComponent).join('/'),old=await github(endpoint);
  await github(endpoint,'PUT',{message:'MK.HUB: '+safeTitle,content:Buffer.from(content).toString('base64'),...(old?.sha?{sha:old.sha}:{})});
 }
 if(body.action==='push-note'){
  if(!/^[\w-]{1,128}$/.test(body.id||''))throw new VaultError(400,'기록을 확인해주세요.');
  const snapshot=await db.doc('mk_app/data/memos/'+body.id).get();if(!snapshot.exists)throw new VaultError(404,'기록을 찾을 수 없습니다.');await pushNote(snapshot);return{count:1};
 }
 if(body.action==='push-all'){
  let query=db.collection('mk_app/data/memos').orderBy('__name__').limit(3);
  if(body.cursor){if(!/^[\w-]{1,128}$/.test(body.cursor))throw new VaultError(400,'잘못된 요청입니다.');query=query.startAfter(body.cursor);}
  const snapshot=await query.get();for(const note of snapshot.docs)await pushNote(note);
  return{count:snapshot.size,cursor:snapshot.size===3?snapshot.docs.at(-1).id:null};
 }
 if(body.action==='pull-all'){
  const entries=await github('/contents/'+base.split('/').map(encodeURIComponent).join('/'));if(!Array.isArray(entries))return{count:0};
  const dirs=entries.filter(entry=>entry.type==='dir'&&!entry.name.startsWith('.')).sort((a,b)=>a.path.localeCompare(b.path));
  const cursor=body.cursor||{directory:0,file:0};
  if(!Number.isSafeInteger(cursor.directory)||!Number.isSafeInteger(cursor.file)||cursor.directory<0||cursor.file<0)throw new VaultError(400,'잘못된 요청입니다.');
  let count=0;
  for(let directory=cursor.directory;directory<dirs.length;directory++){
   const entry=dirs[directory];
   if(entry.type!=='dir'||entry.name.startsWith('.'))continue;
   const list=await github('/contents/'+entry.path.split('/').map(encodeURIComponent).join('/'));if(!Array.isArray(list))continue;
   const folders=await db.collection('mk_app/data/folders').where('name','==',entry.name).limit(1).get();
   const folderId=folders.empty?(await db.collection('mk_app/data/folders').add({name:entry.name,icon:'folder',order:Date.now()})).id:folders.docs[0].id;
   const notes=list.filter(file=>file.name.endsWith('.md')&&file.size<=900000).sort((a,b)=>a.path.localeCompare(b.path));
   for(let index=directory===cursor.directory?cursor.file:0;index<notes.length;index++){
    const file=notes[index];
    if(!file.name.endsWith('.md')||file.size>900000)continue;
    const data=await github('/contents/'+file.path.split('/').map(encodeURIComponent).join('/'));if(!data?.content)continue;
    const text=Buffer.from(data.content,'base64').toString('utf8'),id=text.match(/^mk_id:\s*([\w-]+)$/m)?.[1],titleLine=text.match(/^title:\s*(.+)$/m)?.[1]||file.name.slice(0,-3);
    let title=titleLine;try{const parsed=JSON.parse(titleLine);if(typeof parsed==='string')title=parsed;}catch(e){}
    const content=text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/,''),ref=id?db.doc('mk_app/data/memos/'+id):db.doc('mk_app/data/memos/gh_'+require('node:crypto').createHash('sha256').update(repository+'/'+file.path).digest('hex').slice(0,32)),existing=await ref.get();
    // Import changes text only; existing drawing/attachment fields remain intact.
    await ref.set({t:title,b:content,folder:folderId,u:Date.now(),...(!existing.exists?{type:'text',c:Date.now()}: {})},{merge:true});count++;
    if(count>=3)return{count,cursor:{directory,file:index+1}};
   }
  }
  return{count,cursor:null};
 }
 throw new VaultError(404,'지원하지 않는 요청입니다.');
}
if(process.env.VAULT_GITHUB_ENABLED==='true')exports.vaultGithub=onRequest({...options,secrets:[defineSecret('VAULT_GITHUB_TOKEN')]},api(githubHandler));
module.exports._private.githubHandler=githubHandler;

// Firebase upload tokens are bearer links; private uploads must not retain them.
const {onObjectFinalized}=require('firebase-functions/v2/storage');
const {getStorage}=require('firebase-admin/storage');
exports.sealPrivateUpload=onObjectFinalized({serviceAccount:options.serviceAccount,region:'asia-northeast3',bucket:'mingwon-hub.firebasestorage.app',maxInstances:3},async event=>{
 const object=event.data;if(!/^(mk_files|mk_drawings)\//.test(object.name||''))return;
 const file=getStorage().bucket(object.bucket).file(object.name,{generation:object.generation});
 await file.setMetadata({metadata:{firebaseStorageDownloadTokens:null}});
});
