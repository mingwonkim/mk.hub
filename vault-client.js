/* Private-vault access: server-verified 3x3 pattern; email link only for setup/recovery. */
(function(){
 'use strict';
 const EMAIL='kmin5940@naver.com',BASE='https://asia-northeast3-mingwon-hub.cloudfunctions.net/';
 let auth,mod,storage,storageMod,claims=null,dialog=null,expiryTimer=null,readyResolve;
 // Retire browser-held backup credentials; replacement credentials belong in Secret Manager.
 ['mk_gh_pat','mk_gh_repo','mk_gh_path'].forEach(key=>localStorage.removeItem(key));
 let pendingLink=null;
 const linkURL=new URL(location.href);
 if(linkURL.searchParams.get('mode')==='signIn'&&linkURL.searchParams.has('oobCode')){
  pendingLink={code:linkURL.searchParams.get('oobCode'),mode:linkURL.searchParams.get('vault')==='recover'?'recover':'open'};
  ['mode','oobCode','apiKey','lang','vault','continueUrl'].forEach(key=>linkURL.searchParams.delete(key));history.replaceState(null,'',linkURL.pathname+linkURL.search+linkURL.hash);
 }
 const ready=new Promise(resolve=>{readyResolve=resolve}),files=new Map();
 function active(){return !!(claims&&Number.isFinite(claims.vault_otp_at)&&claims.vault_otp_at<=Date.now()+5000&&claims.email===EMAIL&&claims.email_verified&&claims.vault_owner&&claims.vault_access&&Date.now()-claims.vault_otp_at<43200000);}
 async function api(action,data={},service='vault'){
  await ready;
  const headers={'Content-Type':'application/json'};
  if(auth.currentUser)headers.Authorization='Bearer '+await auth.currentUser.getIdToken();
  let response;
  try{response=await fetch(BASE+service,{method:'POST',headers,body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});}catch(e){throw new Error('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');}
  let result;try{result=await response.json();}catch(e){throw new Error('인증 서버 연결을 준비 중입니다.');}
  if(!response.ok)throw new Error(result.error||'요청을 완료하지 못했습니다.');return result;
 }
 async function acceptUser(user){
  clearTimeout(expiryTimer);
  const result=user?await user.getIdTokenResult():null;
  if(auth.currentUser!==user)return active();claims=result?result.claims:null;
  if(active())expiryTimer=setTimeout(logout,Math.max(0,claims.vault_otp_at+43200000-Date.now()));
  return active();
 }
 async function signIn(token){await mod.signInWithCustomToken(auth,token);await acceptUser(auth.currentUser);}
 function openFlow(mode,callback){
  if(dialog){dialog.querySelector('input')?.focus();return;}
  const box=document.createElement('dialog');box.className='vault-access';box.setAttribute('aria-label','개인 저장고 인증');dialog=box;
  box.innerHTML='<div class="vault-access-sheet"><div class="vault-access-top"><span>MK.HUB / PRIVATE VAULT</span><button type="button" data-close aria-label="닫기">×</button></div><h2></h2><p class="vault-access-description"></p><form><div class="vault-access-fields"></div><p class="vault-access-error" role="alert"></p><button class="vault-access-submit" type="submit"></button></form><button type="button" class="vault-access-secondary" hidden></button></div>';
  document.body.appendChild(box);box.showModal();
  const title=box.querySelector('h2'),desc=box.querySelector('.vault-access-description'),form=box.querySelector('form'),fields=box.querySelector('.vault-access-fields'),err=box.querySelector('.vault-access-error'),submit=box.querySelector('[type=submit]'),secondary=box.querySelector('.vault-access-secondary');
  let busy=false,mailing=false,cooldown=null,sendAfter=0;
  function close(){clearInterval(cooldown);box.close();box.remove();dialog=null;}
  box.querySelector('[data-close]').onclick=close;box.addEventListener('cancel',e=>{e.preventDefault();close();});
  function render(heading,description,button,html,handler){
   title.textContent=heading;desc.textContent=description;submit.textContent=button;submit.hidden=!button;fields.innerHTML=html;err.textContent='';secondary.hidden=true;clearInterval(cooldown);
   form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;submit.disabled=true;fields.inert=true;err.textContent='';
    try{await handler();}catch(error){if(box.isConnected)err.textContent=error.message;}
    finally{busy=false;submit.disabled=false;fields.inert=false;}
   };
   fields.querySelector('input')?.focus();
  }
  // 3x3 pattern: dots 0-8 row-major; crossing an unvisited middle dot adds it (Android rule).
  function patternForm(heading,description,handler){
   render(heading,description,'','<div class="vault-pattern" aria-label="3×3 패턴 입력"><svg viewBox="0 0 300 300" aria-hidden="true"><polyline/></svg>'+Array.from({length:9},(_,i)=>'<span data-dot="'+i+'"></span>').join('')+'</div>',()=>handler(path.join('')));
   const pad=fields.querySelector('.vault-pattern'),line=pad.querySelector('polyline'),dots=pad.querySelectorAll('[data-dot]');let path=[],drawing=false;
   const xy=i=>[i%3*100+50,Math.floor(i/3)*100+50];
   function draw(tip){line.setAttribute('points',path.map(xy).concat(tip?[tip]:[]).join(' '));dots.forEach((d,i)=>d.classList.toggle('on',path.includes(i)));}
   function point(e){const r=pad.getBoundingClientRect();return[(e.clientX-r.left)/r.width*300,(e.clientY-r.top)/r.height*300];}
   function visit([x,y]){
    const c=Math.floor(x/100),r=Math.floor(y/100);if(c<0||c>2||r<0||r>2||Math.hypot(x-c*100-50,y-r*100-50)>38)return;
    const i=r*3+c,last=path.at(-1);if(path.includes(i))return;
    if(last!=null){const lc=last%3,lr=Math.floor(last/3);if((lc+c)%2===0&&(lr+r)%2===0){const mid=(lr+r)/2*3+(lc+c)/2;if(!path.includes(mid))path.push(mid);}}
    path.push(i);if(navigator.vibrate)navigator.vibrate(8);
   }
   pad.addEventListener('pointerdown',e=>{if(busy)return;e.preventDefault();pad.setPointerCapture(e.pointerId);drawing=true;path=[];err.textContent='';const p=point(e);visit(p);draw(p);});
   pad.addEventListener('pointermove',e=>{if(!drawing)return;const p=point(e);visit(p);draw(p);});
   pad.addEventListener('pointerup',()=>{if(!drawing)return;drawing=false;draw();if(!path.length)return;if(path.length<4){err.textContent='점 4개 이상을 이어 그려주세요.';return;}form.requestSubmit();});
   pad.addEventListener('pointercancel',()=>{drawing=false;path=[];draw();});
  }
  function finish(){close();if(active()){window.dispatchEvent(new CustomEvent('mk:vault-unlocked'));if(callback)callback();}}
  function setPin(first){
   if(!first){patternForm('새 패턴 설정','점 4개 이상을 이어 그려주세요.',async drawn=>setPin(drawn));return;}
   patternForm('한 번 더 확인','같은 패턴을 다시 그려주세요.',async drawn=>{
    if(drawn!==first){setPin();err.textContent='패턴이 일치하지 않습니다. 처음부터 다시 그려주세요.';return;}
    const result=await api('set-pin',{passwords:[drawn]});if(!box.isConnected)return;await signIn(result.token);
    localStorage.removeItem('mk_pw4');finish();
   });
  }
  function linkForm(){mode='recover';render('비밀번호 찾기',EMAIL+'으로 인증 링크를 보냅니다. 링크로 돌아오면 새 패턴을 설정합니다.','인증 링크 받기','',requestLink);}
  async function pin(){
   const state=await api('pin-state');
   if(mode==='recover'||!state.configured){if(claims&&claims.vault_recovery&&Date.now()-claims.vault_otp_at<300000)setPin();else linkForm();return;}
   patternForm('저장고 열기','패턴을 그려주세요.',async drawn=>{const result=await api('verify-pin',{passwords:[drawn]});if(!box.isConnected)return;await signIn(result.token);if(mode==='change')setPin();else finish();});
   secondary.hidden=false;secondary.textContent='비밀번호를 잊으셨나요?';secondary.onclick=linkForm;
  }
  async function requestLink(){
   if(mailing||Date.now()<sendAfter)return;
   mailing=true;secondary.disabled=true;submit.disabled=true;err.textContent='';
   try{await api('request-link',{mode});if(!box.isConnected)return;sendAfter=Date.now()+60000;sentForm();}
   catch(error){if(box.isConnected)err.textContent=error.message;secondary.disabled=false;}
   finally{mailing=false;submit.disabled=false;}
  }
  function sentForm(){
   render('메일을 확인해주세요',EMAIL+'으로 인증 링크를 보냈습니다. 메일 안의 링크를 눌러 저장고로 돌아오세요.','인증 링크 다시 받기','',requestLink);
   const update=()=>{const remaining=Math.max(0,Math.ceil((sendAfter-Date.now())/1000));submit.disabled=remaining>0;submit.textContent=remaining?'다시 보내기 · '+remaining+'초':'인증 링크 다시 받기';};update();cooldown=setInterval(update,1000);
  }
  render('저장고 열기','불러오는 중입니다.','','',()=>{});
  ready.then(async()=>{
   if(!box.isConnected)return;
   if(pendingLink){
    mode=pendingLink.mode;
    render('이메일 링크 확인',EMAIL+' 인증 후 저장고로 이동합니다.','저장고로 계속','',async()=>{const result=await api('complete-link',{code:pendingLink.code});if(!box.isConnected)return;pendingLink=null;await signIn(result.token);if(box.isConnected)await pin();});
    secondary.hidden=false;secondary.textContent='새 인증 링크 받기';secondary.onclick=()=>{pendingLink=null;requestLink();};return;
   }
   if(mode==='recover'){requestLink();return;}
   try{await pin();}catch(error){err.textContent=error.message;}
  });
 }
 async function logout(){if(auth)await mod.signOut(auth);files.forEach(value=>{value.then(URL.revokeObjectURL).catch(()=>{});});files.clear();sessionStorage.removeItem('mk_unlocked');location.reload();}
 function privatePath(url){
  if(typeof url!=='string')return null;
  if(url.startsWith('mk-private:'))return url.slice('mk-private:'.length);
  try{const parsed=new URL(url);if(parsed.hostname!=='firebasestorage.googleapis.com')return null;const match=parsed.pathname.match(/^\/v0\/b\/mingwon-hub\.firebasestorage\.app\/o\/(.+)$/);const path=match?decodeURIComponent(match[1]):null;return path&&/^(mk_files|mk_drawings)\//.test(path)?path:null;}catch(e){return null;}
 }
 async function resolveURL(url){
  const path=privatePath(url);if(!path)return url;
  await ready;if(!active())throw new Error('저장고 인증이 필요합니다.');
  if(!files.has(path))files.set(path,storageMod.getBlob(storageMod.ref(storage,path),50*1024*1024).then(blob=>{if(!active())throw new Error('인증이 만료됐습니다.');return URL.createObjectURL(blob);}).catch(error=>{files.delete(path);throw error;}));
  return files.get(path);
 }
 function scan(node){
  if(!(node instanceof Element))return;
  const nodes=[...(node.matches('img,a')?[node]:[]),...node.querySelectorAll('img,a')];
  nodes.forEach(el=>{
   const attr=el.tagName==='IMG'?'src':'href',value=el.getAttribute(attr);if(!privatePath(value))return;
   if(attr==='href'){el.dataset.vaultFile=value;el.setAttribute('href','#');return;}
   if(el.dataset.vaultLoading===value)return;el.dataset.vaultLoading=value;
   resolveURL(value).then(url=>{if(el.getAttribute('src')===value)el.src=url;}).catch(()=>{el.alt='인증 후 파일을 불러올 수 있습니다.';});
  });
 }
 new MutationObserver(records=>records.forEach(record=>{if(record.type==='attributes')scan(record.target);else record.addedNodes.forEach(scan);})).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href']});
 async function download(e){
  const anchor=e.target.closest?.('a');if(!anchor)return;const value=anchor.dataset.vaultFile||anchor.getAttribute('href');if(!privatePath(value))return;e.preventDefault();
  try{const url=await resolveURL(value),link=document.createElement('a');link.href=url;link.download=privatePath(value).split('/').pop();link.click();}catch(error){if(window.toast)toast(error.message);}
 }
 document.addEventListener('click',download,true);document.addEventListener('auxclick',download,true);
 window.MKVault={
  async init(a,m,s,sm){auth=a;mod=m;storage=s;storageMod=sm;await mod.setPersistence(auth,mod.browserSessionPersistence);readyResolve();if(pendingLink){if(window.mkFinishArrival)window.mkFinishArrival();openFlow('link');}},
  acceptUser,hasAccess:active,api,resolveURL,
  requireAccess(callback){if(active())callback();else openFlow('open',callback);},
  unlock(callback){openFlow('open',callback);},recover(){openFlow('recover');},changePin(){openFlow('change');},logout,
  async logoutAll(){await api('logout-all');await logout();}
 };
 window.dispatchEvent(new CustomEvent('mk:vault-ready'));
})();
