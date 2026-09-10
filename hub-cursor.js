/* A precise arrow with a pressed state. Native caret for writing. */
(function(){
  'use strict';
  var media=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  var root=document.documentElement,cur=document.createElement('div');cur.id='mkCursor';cur.setAttribute('aria-hidden','true');
  cur.innerHTML='<svg viewBox="0 0 27 32" xmlns="http://www.w3.org/2000/svg"><path d="M3 2L23 19L14 20L10 29Z"/></svg>';
  document.body.appendChild(cur);
  function hide(){cur.style.opacity='0';cur.classList.remove('mk-cur-down');root.classList.remove('mk-cursor-text','mk-cursor-draw');}
  function enable(){root.classList.toggle('mk-cursor-on',media.matches);hide();}
  function move(e){
    if(!media.matches||e.pointerType==='touch')return;
    var el=e.target instanceof Element?e.target:null;if(!el)return;
    if(el.tagName==='IFRAME'){hide();return;}
    var writing=el.closest('textarea,[contenteditable="true"],input:not([type]),input[type="text"],input[type="search"],input[type="email"],input[type="password"],input[type="url"],input[type="number"]');
    var drawing=el.id==='memoDrawCanvas';root.classList.toggle('mk-cursor-draw',drawing);
    root.classList.toggle('mk-cursor-text',!!writing);
    var host=el.closest('dialog[open]')||document.body;if(cur.parentNode!==host)host.appendChild(cur);
    cur.style.transform='translate3d('+e.clientX+'px,'+e.clientY+'px,0)';cur.style.opacity=writing||drawing?'0':'1';
    cur.classList.toggle('mk-cur-hot',!!el.closest('a,button,summary,[role="button"],[onclick],select,input'));
  }
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerdown',function(e){move(e);if(e.button===0)cur.classList.add('mk-cur-down');},{passive:true});
  document.addEventListener('pointerup',function(){cur.classList.remove('mk-cur-down');},{passive:true});
  document.addEventListener('pointercancel',hide,{passive:true});
  document.documentElement.addEventListener('pointerleave',hide);
  window.addEventListener('blur',hide);document.addEventListener('visibilitychange',hide);
  media.addEventListener('change',enable);enable();
})();
