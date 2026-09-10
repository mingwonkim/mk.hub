/* Motion for the weekly planner, morning post and the shared visual archive. */
(function(){
  'use strict';
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var week=document.querySelector('.todo-hub');
  var pointer={x:0,y:0};
  week.addEventListener('click',function(e){
    var button=e.target.closest('[data-week-toggle]');if(!button)return;
    var rect=button.querySelector('.week-task-mark').getBoundingClientRect();
    pointer={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    toggleTodo(button.dataset.weekToggle);
  });
  document.getElementById('todoHubWeek').addEventListener('keydown',function(e){
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    var buttons=Array.from(this.querySelectorAll('.week-day')),index=buttons.indexOf(document.activeElement);
    if(index<0)return;e.preventDefault();index=(index+(e.key==='ArrowRight'?1:6))%7;
    buttons[index].click();this.querySelectorAll('.week-day')[index].focus({preventScroll:true});
  });
  window.addEventListener('mk:todo-toggled',function(e){
    if(reduced.matches)return;
    var circle=document.getElementById('weekOrbit');
    circle.animate([{transform:'scale(1)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:450,easing:'ease-out'});
    if(!e.detail.done||!pointer.x)return;
    for(var i=0;i<10;i++){
      var dot=document.createElement('span'),angle=i/10*Math.PI*2;
      dot.className='week-particle';dot.style.left=pointer.x+'px';dot.style.top=pointer.y+'px';document.body.appendChild(dot);
      var animation=dot.animate([{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:'translate('+Math.cos(angle)*65+'px,'+Math.sin(angle)*65+'px) rotate(130deg) scale(.2)'}],{duration:550,easing:'ease-out'});
      animation.onfinish=(function(node){return function(){node.remove();};})(dot);
    }
    pointer.x=0;
  });
  var tasks=document.getElementById('weekTasks');
  new MutationObserver(function(){
    if(reduced.matches)return;
    tasks.querySelectorAll('.week-task,.week-empty').forEach(function(row,i){row.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,delay:Math.min(i*35,210),fill:'backwards',easing:'ease-out'});});
  }).observe(tasks,{childList:true});
  renderTodoHub();

  // Scroll is the entrance timeline; reaching the end releases the hub once.
  var delivery=document.getElementById('briefDelivery');
  var arrival=document.getElementById('briefArrival');
  if(arrival&&arrival.open&&!reduced.matches){
    var stage=arrival.querySelector('.arrival-stage');
    stage.appendChild(delivery.querySelector('svg').cloneNode(true));
    var animations=stage.getAnimations({subtree:true});
    animations.forEach(function(animation){animation.pause();animation.currentTime=0;});
    var progress=0,targetProgress=0,frame=null,target=null,source=null,center=null,lastTouchY=null;
    var black=arrival.querySelector('.arrival-black'),label=arrival.querySelector('.arrival-label');
    function paint(){
      frame=null;if(!arrival.open)return;
      progress+=(targetProgress-progress)*.18;
      if(Math.abs(targetProgress-progress)<.0005)progress=targetProgress;
      arrival.style.setProperty('--arrival-progress',progress);
      animations.forEach(function(animation){animation.currentTime=Math.min(progress/.65,1)*6100;});
      var opening=Math.max(0,(progress-.88)/.12);
      label.textContent=progress<.40?'SCROLL TO BRING THE MORNING HOME':progress<.65?'A LITTLE NEWS, JUST FOR YOU.':progress<.88?'KEEP SCROLLING':'WELCOME HOME';
      var titleIn=Math.max(0,Math.min(1,(progress-.65)/.045)),titleOut=Math.max(0,Math.min(1,(.94-progress)/.06));
      var titleAlpha=titleIn*titleOut,titleTravel=Math.max(0,Math.min(1,(progress-.65)/.2));
      arrival.style.setProperty('--title-opacity',titleAlpha);arrival.style.setProperty('--title-travel',titleTravel);stage.style.opacity=1-titleAlpha;
      if(opening>0){
        if(!source){
          delivery.scrollIntoView({block:'center',behavior:'instant'});
          source=stage.getBoundingClientRect();target=delivery.querySelector('svg').getBoundingClientRect();
          var box=delivery.querySelector('.brief-mail-body').getBoundingClientRect();center={x:box.left+box.width/2,y:box.top+box.height/2};
        }
        document.documentElement.classList.remove('mk-arrival-hold');document.documentElement.style.overflow='hidden';
        var ease=opening*opening*(3-2*opening),sx=1+(target.width/source.width-1)*ease,sy=1+(target.height/source.height-1)*ease;
        stage.style.transform='translate('+((target.left-source.left)*ease)+'px,'+((target.top-source.top)*ease)+'px) scale('+sx+','+sy+')';
        var radius=Math.hypot(innerWidth,innerHeight)*ease;
        black.style.maskImage='radial-gradient(circle at '+center.x+'px '+center.y+'px,transparent '+radius+'px,#000 '+(radius+2)+'px)';
        label.style.opacity=1-opening;
      }else{
        document.documentElement.classList.add('mk-arrival-hold');stage.style.transform='';black.style.maskImage='';label.style.opacity=1;
      }
      if(progress>=.9995){delivery.classList.add('delivered');window.mkFinishArrival();return;}
      if(progress!==targetProgress)frame=requestAnimationFrame(paint);
    }
    function advance(delta){
      targetProgress=Math.max(0,Math.min(1,targetProgress+delta/(innerWidth<768?1100:1800)));
      if(!frame)frame=requestAnimationFrame(paint);
    }
    arrival.addEventListener('wheel',function(e){e.preventDefault();advance(e.deltaY*(e.deltaMode===1?20:e.deltaMode===2?innerHeight:1));},{passive:false});
    arrival.addEventListener('touchstart',function(e){if(e.touches.length===1)lastTouchY=e.touches[0].clientY;},{passive:true});
    arrival.addEventListener('touchmove',function(e){if(lastTouchY===null||e.touches.length!==1)return;e.preventDefault();var y=e.touches[0].clientY;advance((lastTouchY-y)*2);lastTouchY=y;},{passive:false});
    arrival.addEventListener('touchend',function(){lastTouchY=null;},{passive:true});
    arrival.addEventListener('keydown',function(e){
      if(['ArrowDown','PageDown',' ','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();advance(['ArrowUp','PageUp'].includes(e.key)?-180:180);}
    });
    arrival.addEventListener('close',function(){if(frame)cancelAnimationFrame(frame);animations.forEach(function(animation){animation.cancel();});},{once:true});
    window.addEventListener('resize',function(){if(!arrival.open)return;source=null;stage.style.transform='';if(!frame)frame=requestAnimationFrame(paint);});
    paint();
  }

  var frames=['edLayoutFrame','ltScaleFrame','mbFrame','p4Frame','p5Frame'].map(function(id){return document.getElementById(id);});
  var nav=Array.from(document.querySelectorAll('.archive-nav a'));
  var scheduled=false;
  function trackChapters(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;var current=0;
      frames.forEach(function(frame,i){
        var rect=frame.getBoundingClientRect();if(rect.top<innerHeight*.5)current=i;
        if(frame.contentWindow){
          frame.contentWindow.postMessage({type:'mk_gallery_scroll',active:rect.top<innerHeight&&rect.bottom>0,progress:Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)))},location.origin);
        }
      });
      nav.forEach(function(link,i){link.setAttribute('aria-current',String(i===current));});
    });
  }
  nav.forEach(function(link){link.addEventListener('click',function(e){e.preventDefault();document.querySelector(link.getAttribute('href')).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});});
  window.addEventListener('scroll',trackChapters,{passive:true});
  window.addEventListener('resize',trackChapters);
  trackChapters();

  // Full-viewport lightbox lives in the parent so iframe height never clips it.
  var dialog=document.getElementById('hubArchiveLightbox'),photos=[],currentPhoto=0,focusBack=null,lightboxFrame=null;
  var previousOverflow='';
  function drawPhoto(){
    var photo=photos[currentPhoto];if(!photo)return;
    var large=document.getElementById('hubArchiveLarge');large.src=photo.src;large.alt=photo.alt;
    document.getElementById('hubArchiveCounter').textContent=(currentPhoto+1)+' / '+photos.length+' — '+photo.title;
    if(!reduced.matches)large.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.2,1,.3,1)'});
  }
  function movePhoto(dir){if(!photos.length)return;currentPhoto=(currentPhoto+dir+photos.length)%photos.length;drawPhoto();}
  window.addEventListener('message',function(e){
    if(e.origin!==location.origin||!e.data)return;
    var frame=frames.find(function(f){return f.contentWindow===e.source;});if(!frame)return;
    if(e.data.type==='mk_gallery_changed'){
      if(typeof _picCache!=='undefined')delete _picCache[e.data.page+'picture.html'];
    }
    if(e.data.type==='mk_gallery_open'){
      var doc=frame.contentDocument;
      photos=Array.from(doc.querySelectorAll('.archive-card.has-image')).map(function(card){var img=card.querySelector('img');return{key:card.dataset.picKey,src:img.src,alt:img.alt,title:doc.querySelector('h1').textContent};});
      currentPhoto=photos.findIndex(function(photo){return photo.key===e.data.key;});
      if(currentPhoto<0)return;
      focusBack=doc.activeElement;lightboxFrame=frame;drawPhoto();previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();
    }
  });
  document.getElementById('hubArchiveClose').onclick=function(){dialog.close();};
  document.getElementById('hubArchivePrev').onclick=function(){movePhoto(-1);};
  document.getElementById('hubArchiveNext').onclick=function(){movePhoto(1);};
  dialog.addEventListener('close',function(){document.documentElement.style.overflow=previousOverflow;if(lightboxFrame)lightboxFrame.focus({preventScroll:true});if(focusBack)focusBack.focus({preventScroll:true});});
  dialog.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')movePhoto(-1);if(e.key==='ArrowRight')movePhoto(1);});
  var touchX=0,touchY=0;
  dialog.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;},{passive:true});
  dialog.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))movePhoto(dx<0?1:-1);},{passive:true});
  // The main page unfolds as one sequence: type, module cards, planner, then the wooden archive.
  var hub=document.getElementById('page-hub'),heroLetters=Array.from(hub.querySelectorAll('.hub-hero-title .mk-ch'));
  var moduleCards=Array.from(document.querySelectorAll('#hubCardGrid>section')),motionFrame=null,lastScroll=scrollY,lastTime=performance.now();
  function clamp(value){return Math.max(0,Math.min(1,value));}
  function mainMotion(){
    motionFrame=null;
    if(reduced.matches||!hub.classList.contains('active')||arrival.open)return;
    var y=scrollY,vh=innerHeight,now=performance.now(),velocity=Math.min(1,Math.abs(y-lastScroll)/Math.max(now-lastTime,16)/2);
    lastScroll=y;lastTime=now;
    var heroProgress=clamp(y/(vh*.85));
    heroLetters.forEach(function(letter,i){letter.style.translate=((i-2.5)*heroProgress*11)+'px '+(Math.sin(i*.9)*heroProgress*44)+'px';letter.style.rotate=((i-2.5)*heroProgress*5)+'deg';});
    document.querySelectorAll('#bgGrid .bg-cell img').forEach(function(img,i){img.style.transform='scale(1.16) translateY('+(Math.sin(y/vh*.45+i)*4)+'%)';});
    moduleCards.forEach(function(card,i){var r=card.getBoundingClientRect(),t=clamp((vh-r.top)/(vh*.65));card.style.setProperty('--scroll-lean',((i-1)*(1-t)*7)+'deg');card.style.setProperty('--scroll-lift',((1-t)*65)+'px');});
    var wr=week.getBoundingClientRect(),wp=clamp((vh-wr.top)/(vh*.6));
    week.querySelectorAll('.week-day').forEach(function(day,i){day.style.setProperty('--day-lift',((1-clamp(wp*1.7-i*.11))*30)+'px');});
    var gallery=hub.querySelector('.gallery-section');gallery.style.setProperty('--scroll-energy',velocity.toFixed(3));
  }
  function scheduleMainMotion(){if(!motionFrame)motionFrame=requestAnimationFrame(mainMotion);}
  window.addEventListener('scroll',scheduleMainMotion,{passive:true});window.addEventListener('resize',scheduleMainMotion);
  document.addEventListener('mk:introend',scheduleMainMotion);
  new MutationObserver(function(){
    if(!hub.classList.contains('active'))document.querySelectorAll('#bgGrid .bg-cell img').forEach(function(img){img.style.transform='';});
    else scheduleMainMotion();
  }).observe(hub,{attributes:true,attributeFilter:['class']});
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('#hubCardGrid>section>button,.week-bottom button,.archive-nav a').forEach(function(button){
      button.addEventListener('pointermove',function(e){if(reduced.matches)return;var r=button.getBoundingClientRect();button.style.translate=((e.clientX-r.left-r.width/2)*.13)+'px '+((e.clientY-r.top-r.height/2)*.18)+'px';});
      button.addEventListener('pointerleave',function(){button.style.translate='';});
    });
  }
  scheduleMainMotion();

  // A quiet, non-interactive wash of green leaves over the main page.
  var leaf=document.createElement('div');leaf.className='hub-leaf-shadow';leaf.setAttribute('aria-hidden','true');
  leaf.innerHTML='<svg viewBox="0 0 900 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><defs><path id="hubShadowLeaf" d="M0 0C-62-8-99-59-87-124C-25-109 15-56 0 0Z"/></defs><path d="M875-80Q640 230 328 890" fill="none" stroke="currentColor" stroke-width="10"/>'+[[735,150,-15,1.6],[668,255,105,1.9],[623,340,-24,1.7],[572,442,110,2.1],[516,540,-30,1.85],[455,650,102,1.8],[385,760,-22,1.7],[802,64,105,1.6]].map(function(v){return '<use href="#hubShadowLeaf" transform="translate('+v[0]+' '+v[1]+') rotate('+v[2]+') scale('+v[3]+')"/>';}).join('')+'</svg>';
  document.body.appendChild(leaf);
  var leafTimer=null;
  function scheduleLeaves(delay){clearTimeout(leafTimer);if(reduced.matches||document.hidden||!hub.classList.contains('active')||arrival.open)return;leafTimer=setTimeout(function(){leaf.classList.add('is-passing');},delay);}
  leaf.addEventListener('animationend',function(e){if(e.target!==leaf)return;leaf.classList.remove('is-passing');scheduleLeaves(23000);});
  function resetLeaves(){leaf.classList.remove('is-passing');scheduleLeaves(8000);}
  document.addEventListener('mk:introend',resetLeaves);
  document.addEventListener('visibilitychange',resetLeaves);
  new MutationObserver(resetLeaves).observe(hub,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',resetLeaves);
  scheduleLeaves(8000);

})();
