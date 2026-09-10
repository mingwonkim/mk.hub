/* Shared archive presentation. Existing IndexedDB keys and legacy text keys stay intact. */
(function(){
  'use strict';
  var config=JSON.parse(document.getElementById('archiveConfig').textContent);
  var root=document.getElementById('archiveRoot');
  var cards=Array.from(document.querySelectorAll('[data-pic-key]'));
  var texts=Array.from(document.querySelectorAll('[data-text-key]'));
  var editButton=document.getElementById('archiveEdit');
  var status=document.getElementById('archiveStatus');
  var fileInput=document.getElementById('archiveFile');
  var lightbox=document.getElementById('archiveLightbox');
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  var unlocked=false,editing=false,activeCard=null,loading=true,busy=false,lightboxIndex=0,returnFocus=null;
  var stored={};
  var previousOverflow='';
  var removedKey='mk_gallery_p'+config.page+'_removed_v1';
  var removed={};
  if(config.page<5){
    var viewButton=document.createElement('button');
    viewButton.type='button';viewButton.className='archive-view';viewButton.textContent='모아 보기 ⊞';viewButton.setAttribute('aria-pressed','false');
    root.querySelector('.archive-title-row').insertBefore(viewButton,editButton);
    viewButton.addEventListener('click',function(){
      var before=cards.map(function(card){return card.getBoundingClientRect();});
      var compact=document.body.classList.toggle('is-compact');
      viewButton.textContent=compact?'펼쳐 보기 ↗':'모아 보기 ⊞';viewButton.setAttribute('aria-pressed',String(compact));
      if(!reduced.matches)cards.forEach(function(card,i){
        var after=card.getBoundingClientRect();
        card.animate([{transform:'translate('+(before[i].left-after.left)+'px,'+(before[i].top-after.top)+'px) scale('+(before[i].width/after.width)+')'},{transform:'none'}],{duration:550,easing:'cubic-bezier(.22,1,.36,1)'});
      });
      sendHeight();
    });
  }
  document.body.classList.toggle('is-embedded',window.parent!==window);
  try{
    var labels=JSON.parse(localStorage.getItem('masterLabels')||'{}');
    if(labels['gal_tag'+config.page])root.querySelector('h1').firstChild.textContent=labels['gal_tag'+config.page];
  }catch(e){}
  try{stored=JSON.parse(localStorage.getItem(config.storageKey)||'{}')||{};removed=JSON.parse(localStorage.getItem(removedKey)||'{}')||{};}catch(e){status.textContent='저장된 문구를 읽지 못했습니다';}
  texts.forEach(function(el){
    var value=(stored[config.textField]||{})[el.dataset.textKey];
    if(typeof value==='string')el.innerHTML=value;
  });
  // Bring existing captions into the layout without duplicating their persistence keys.
  var featured={1:'t5',2:'headline',4:'t13'}[config.page];
  if(featured){
    var quote=texts.find(function(el){return el.dataset.textKey===featured;});
    var subtitle=root.querySelector('.archive-subline p');
    if(quote&&subtitle){subtitle.replaceWith(quote);quote.style.maxWidth='580px';quote.style.fontSize='15px';}
  }
  if(config.page===3){
    ['t2','t5','t8','t11','t12'].forEach(function(key,i){
      var text=texts.find(function(el){return el.dataset.textKey===key;});
      if(text)cards[i].querySelector('figcaption').appendChild(text);
    });
  }
  function sendHeight(){
    if(window.parent===window)return;
    window.parent.postMessage({type:'iframe_height',id:config.frame,value:Math.ceil(root.getBoundingClientRect().height)},location.origin);
  }
  new ResizeObserver(sendHeight).observe(root);
  function setEditing(next){
    editing=!!next&&unlocked&&!loading&&!busy;
    document.body.classList.toggle('is-editing',editing);
    editButton.textContent=editing?'완료 ✓':'편집 ↗';
    editButton.setAttribute('aria-pressed',String(editing));
    texts.forEach(function(el){el.contentEditable=String(editing);});
    if(editing)document.querySelector('.archive-notes').open=true;
    sendHeight();
  }
  window.addEventListener('message',function(e){
    if(e.origin!==location.origin||e.source!==window.parent||!e.data)return;
    if(e.data.type==='mk_unlock'){
      unlocked=e.data.value===true;editButton.hidden=!unlocked;
      if(!unlocked){busy=false;setEditing(false);}
    }
    if(e.data.type==='mk_gallery_scroll'){
      document.body.classList.toggle('sap-active',!!e.data.active);
    }
    if(e.data.type==='mk_gallery_scroll'&&!reduced.matches){
      root.querySelector('h1').style.translate=((e.data.progress-.35)*-24).toFixed(1)+'px 0';
    }
  });
  // Direct pages share the same tab session; embedded pages receive the parent's lock state.
  if(window.parent===window){unlocked=sessionStorage.getItem('mk_unlocked')==='1';editButton.hidden=!unlocked;}
  editButton.addEventListener('click',function(){setEditing(!editing);});
  function saveText(){
    if(!editing)return;
    var values=Object.assign({},stored[config.textField]);
    texts.forEach(function(el){values[el.dataset.textKey]=el.innerHTML;});
    stored[config.textField]=values;
    try{localStorage.setItem(config.storageKey,JSON.stringify(stored));status.textContent='문구 저장됨';}
    catch(e){status.textContent='문구 저장 실패 · 저장 공간을 확인하세요';}
  }
  texts.forEach(function(el){
    el.addEventListener('input',saveText);
    el.addEventListener('paste',function(e){if(!editing)return;e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));});
  });
  function applyPhoto(card,src){
    var img=card.querySelector('img');
    if(src)img.src=src;else img.removeAttribute('src');
    card.classList.toggle('has-image',!!src);
    card.querySelector('[data-action=remove]').disabled=!src;
  }
  function notifyPhotoChange(){
    if(window.parent!==window)window.parent.postMessage({type:'mk_gallery_changed',page:config.page},location.origin);
  }
  // Legacy values are only copied when IndexedDB has no value. Nothing is erased during loading.
  MKPics.getMany(cards.map(function(card){return card.dataset.picKey;})).then(async function(values){
    for(var i=0;i<cards.length;i++){
      var card=cards[i],key=card.dataset.picKey,shortKey=key.split(':')[1],src=values[i];
      if(removed[key]){applyPhoto(card,'');continue;}
      if(!src){
        src=(stored.images||{})[shortKey];
        if(!src&&config.page===3)src=localStorage.getItem('mb_img_'+shortKey);
        if(src)await MKPics.set(key,src);
      }
      if(src)applyPhoto(card,src);
      else applyPhoto(card,card.querySelector('img').getAttribute('src')||'');
    }
    loading=false;editButton.disabled=false;sendHeight();
  }).catch(function(){loading=false;editButton.disabled=false;status.textContent='사진 불러오기 실패';});
  editButton.disabled=true;
  async function savePhoto(card,src){
    if(!editing||busy||!unlocked)return;
    busy=true;status.textContent='저장 중…';editButton.disabled=true;
    var key=card.dataset.picKey,oldRemoved=Object.assign({},removed);
    try{
      await MKPics.set(key,src||null);
      // MKPics.set historically swallows write errors; confirm the actual persisted value.
      var saved=await MKPics.get(key);
      if((saved||'')!==src)throw new Error('Photo write failed');
      if(src)delete removed[key];else removed[key]=true;
      // Keep the original contact-print synchronization for the second collection.
      var copies={'p2:photo-5':'p2:copy-02','p2:photo-1':'p2:copy-03','p2:photo-2':'p2:copy-04','p2:photo-4':'p2:copy-05','p2:hero':'p2:copy-01'};
      if(copies[key]){
        await MKPics.set(copies[key],src||null);
        if((await MKPics.get(copies[key])||'')!==src)throw new Error('Contact print write failed');
        if(src)delete removed[copies[key]];else removed[copies[key]]=true;
        applyPhoto(cards.find(function(other){return other.dataset.picKey===copies[key];}),src);
      }
      localStorage.setItem(removedKey,JSON.stringify(removed));
      applyPhoto(card,src);status.textContent=src?'사진 저장됨':'사진 삭제됨';notifyPhotoChange();
    }catch(e){removed=oldRemoved;status.textContent='저장 실패 · 다시 시도하세요';}
    finally{busy=false;editButton.disabled=false;}
  }
  cards.forEach(function(card){
    var photo=card.querySelector('.archive-photo');
    card.querySelector('[data-action=replace]').addEventListener('click',function(){
      if(!editing||busy)return;activeCard=card;fileInput.click();
    });
    card.querySelector('[data-action=remove]').addEventListener('click',function(){savePhoto(card,'');});
    photo.addEventListener('click',function(){
      if(editing){if(!busy){activeCard=card;fileInput.click();}return;}
      if(!card.classList.contains('has-image'))return;
      if(window.parent!==window){
        window.parent.postMessage({type:'mk_gallery_open',page:config.page,key:card.dataset.picKey},location.origin);return;
      }
      returnFocus=photo;lightboxIndex=visiblePhotos().indexOf(card);showLightbox();previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';lightbox.showModal();
    });
    photo.addEventListener('pointermove',function(e){
      if(!fine.matches||reduced.matches||editing)return;
      var rect=photo.getBoundingClientRect();
      photo.style.setProperty('--rx',(-(e.clientY-rect.top-rect.height/2)/rect.height*9)+'deg');
      photo.style.setProperty('--ry',((e.clientX-rect.left-rect.width/2)/rect.width*9)+'deg');
    });
    photo.addEventListener('pointerleave',function(){photo.style.removeProperty('--rx');photo.style.removeProperty('--ry');});
  });
  fileInput.addEventListener('change',async function(){
    var file=fileInput.files[0],card=activeCard;fileInput.value='';
    if(!file||!card||!editing)return;
    try{var src=await MKPics.fileToDataURL(file);await savePhoto(card,src);}catch(e){status.textContent='사진을 읽지 못했습니다';}
  });
  function visiblePhotos(){return cards.filter(function(card){return card.classList.contains('has-image');});}
  function showLightbox(){
    var photos=visiblePhotos(),card=photos[lightboxIndex];if(!card)return;
    var img=card.querySelector('img'),large=document.getElementById('archiveLarge');large.src=img.src;large.alt=img.alt;
    document.getElementById('archiveCounter').textContent=config.title+' / '+(lightboxIndex+1)+' — '+photos.length;
    if(!reduced.matches)large.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:350,easing:'ease-out'});
  }
  function navigate(dir){var total=visiblePhotos().length;if(!total)return;lightboxIndex=(lightboxIndex+dir+total)%total;showLightbox();}
  document.getElementById('archiveClose').onclick=function(){lightbox.close();};
  document.getElementById('archivePrev').onclick=function(){navigate(-1);};
  document.getElementById('archiveNext').onclick=function(){navigate(1);};
  lightbox.addEventListener('close',function(){document.documentElement.style.overflow=previousOverflow;if(returnFocus)returnFocus.focus({preventScroll:true});});
  lightbox.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')navigate(-1);if(e.key==='ArrowRight')navigate(1);});
  var touchX=0,touchY=0;
  lightbox.addEventListener('touchstart',function(e){touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;},{passive:true});
  lightbox.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))navigate(dx<0?1:-1);},{passive:true});
  if(!reduced.matches){
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.remove('reveal-wait');observer.unobserve(entry.target);}});},{threshold:.06});
    cards.forEach(function(card){card.classList.add('reveal-wait');observer.observe(card);});
  }
  // Branching amber sap echoes the hub's living vein layer without covering the photos.
  var ns='http://www.w3.org/2000/svg',sap=document.createElementNS(ns,'svg');
  sap.classList.add('archive-sap');sap.setAttribute('viewBox','0 0 1200 1800');sap.setAttribute('preserveAspectRatio','none');sap.setAttribute('aria-hidden','true');root.prepend(sap);
  var paths=[
    'M70 1840C180 1580 -20 1350 65 1170S180 810 85 620S45 240 135 -40',
    'M1150 1850C1030 1490 1190 1250 1110 970S1190 480 1060 90L1080 -50',
    'M68 1220C170 1140 190 1030 300 1010S460 940 475 820',
    'M115 470C240 460 230 350 350 310S510 240 505 130',
    'M1100 890C1020 800 900 840 850 690S740 540 670 510',
    'M1145 1470C1020 1440 1030 1300 910 1270S790 1110 745 1080',
    'M65 1490C210 1510 185 1660 320 1670S470 1770 510 1810',
    'M1050 180C950 220 980 350 860 390S755 460 780 540'
  ];
  paths.forEach(function(d,i){
    var bark=document.createElementNS(ns,'path');bark.setAttribute('d',d);bark.setAttribute('class','sap-bark');sap.appendChild(bark);
    var flow=bark.cloneNode();flow.setAttribute('class','sap-flow');flow.setAttribute('pathLength','300');flow.style.animationDelay=(-i*1.3)+'s';sap.appendChild(flow);
  });
  if(window.parent===window)document.body.classList.add('sap-active');
  var lastSap={x:0,y:0},sprigs=[];
  function growSap(e){
    if(reduced.matches||editing)return;
    var rect=root.getBoundingClientRect(),x=(e.clientX-rect.left)*1200/rect.width,y=(e.clientY-rect.top)*1800/rect.height;
    if(Math.hypot(x-lastSap.x,y-lastSap.y)<65&&e.type!=='pointerdown')return;lastSap={x:x,y:y};
    var group=document.createElementNS(ns,'g');sap.appendChild(group);sprigs.push(group);
    if(sprigs.length>12)sprigs.shift().remove();
    for(var i=0;i<4;i++){
      var angle=i*1.57+Math.random()*.5,px=x,py=y,d='M'+x+' '+y;
      for(var j=0;j<5;j++){angle+=(Math.random()-.5)*.8;px+=Math.cos(angle)*(8+j*3);py+=Math.sin(angle)*(8+j*3);d+='L'+px.toFixed(1)+' '+py.toFixed(1);}
      var twig=document.createElementNS(ns,'path');twig.setAttribute('d',d);twig.setAttribute('fill','none');twig.setAttribute('stroke',i%2?'#d59b4e':'#ef6b32');twig.setAttribute('stroke-width',i%2?'1':'1.5');twig.setAttribute('pathLength','100');twig.style.strokeDasharray='100';group.appendChild(twig);
      twig.animate([{strokeDashoffset:'100',opacity:.85},{strokeDashoffset:'0',opacity:.65,offset:.4},{strokeDashoffset:'0',opacity:0}],{duration:2200,easing:'ease-out',fill:'forwards'});
    }
    setTimeout(function(){group.remove();sprigs=sprigs.filter(function(node){return node!==group;});},2300);
  }
  root.addEventListener('pointermove',growSap,{passive:true});root.addEventListener('pointerdown',growSap,{passive:true});

  window.addEventListener('load',sendHeight);
})();
