/* MK.HUB gallery interaction bridge: presentation-only; it never reads or writes photo storage. */
(function(){
  'use strict';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)');
  function animate(){return !(reduce&&reduce.matches);}
  function setTheme(mode){document.documentElement.dataset.mkTheme=mode==='light'?'light':'dark';}
  function clear(root){root.querySelectorAll('.mk-gallery-active').forEach(function(el){el.classList.remove('mk-gallery-active');});}
  function bind(slot,root){
    if(slot.dataset.mkGalleryBound==='1')return;
    slot.dataset.mkGalleryBound='1';slot.classList.add('mk-gallery-slot');
    slot.addEventListener('pointerenter',function(){if(fine&&fine.matches&&animate())slot.classList.add('mk-gallery-hot');});
    slot.addEventListener('pointerleave',function(){slot.classList.remove('mk-gallery-hot');});
    slot.addEventListener('pointerup',function(event){
      if(event.pointerType==='mouse'||!animate())return;
      var active=slot.classList.contains('mk-gallery-active');clear(root);
      if(!active)slot.classList.add('mk-gallery-active');
    });
  }
  function init(options){
    options=options||{};
    var root=document.querySelector(options.root||'body');if(!root)return;
    root.querySelectorAll(options.slots||'[data-mk-gallery-slot]').forEach(function(slot){bind(slot,root);});
    if(animate()&&'IntersectionObserver'in window){
      var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){root.classList.add('mk-gallery-reveal');observer.disconnect();}});},{threshold:.08});
      observer.observe(root);
    }else root.classList.add('mk-gallery-reveal');
    if(window.parent!==window)window.parent.postMessage({type:'mk_theme_ready'},window.location.origin);
  }
  window.addEventListener('message',function(event){
    if(event.origin!==window.location.origin||!event.data)return;
    if(event.data.type==='mk_theme')setTheme(event.data.value);
  });
  window.MKGalleryMotion={init:init,setTheme:setTheme};
})();
