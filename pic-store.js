/* MK.HUB 갤러리 사진 저장소 — IndexedDB 공용 헬퍼
 * localStorage(5MB 한계) 대신 IndexedDB에 사진(dataURL)을 저장한다.
 * 키 규칙: p1:s1~s5 / p2:photo-1… / p3:img-1… / p4:img-0… / p5:cell-N
 */
(function(){
  var DB_NAME='mkhub_pics', STORE='pics', _db=null;

  function open(){
    return new Promise(function(res,rej){
      if(_db){res(_db);return;}
      if(!window.indexedDB){rej(new Error('no idb'));return;}
      var r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=function(){r.result.createObjectStore(STORE);};
      r.onsuccess=function(){_db=r.result;res(_db);};
      r.onerror=function(){rej(r.error);};
    });
  }

  function get(key){
    return open().then(function(db){
      return new Promise(function(res,rej){
        var q=db.transaction(STORE).objectStore(STORE).get(key);
        q.onsuccess=function(){res(q.result||null);};
        q.onerror=function(){rej(q.error);};
      });
    }).catch(function(){return null;});
  }

  function set(key,val){
    return open().then(function(db){
      return new Promise(function(res,rej){
        var tx=db.transaction(STORE,'readwrite');
        if(val==null)tx.objectStore(STORE).delete(key);
        else tx.objectStore(STORE).put(val,key);
        tx.oncomplete=function(){res();};
        tx.onerror=function(){rej(tx.error);};
      });
    }).catch(function(){});
  }

  function getMany(keys){return Promise.all(keys.map(get));}

  /* 파일 → 축소·압축된 dataURL (최대 1600px, JPEG q0.85). 실패 시 원본 dataURL 반환 */
  function fileToDataURL(file,maxDim,quality){
    maxDim=maxDim||1600;quality=quality||0.85;
    return new Promise(function(res,rej){
      var r=new FileReader();
      r.onload=function(){res(r.result);};
      r.onerror=function(){rej(r.error);};
      r.readAsDataURL(file);
    }).then(function(raw){
      return new Promise(function(res){
        var img=new Image();
        img.onload=function(){
          var w=img.naturalWidth,h=img.naturalHeight;
          if(!w||!h){res(raw);return;}
          var sc=Math.min(1,maxDim/Math.max(w,h));
          var c=document.createElement('canvas');
          c.width=Math.round(w*sc);c.height=Math.round(h*sc);
          var x=c.getContext('2d');
          x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
          x.drawImage(img,0,0,c.width,c.height);
          try{res(c.toDataURL('image/jpeg',quality));}catch(e){res(raw);}
        };
        img.onerror=function(){res(raw);};
        img.src=raw;
      });
    });
  }

  window.MKPics={get:get,set:set,getMany:getMany,fileToDataURL:fileToDataURL};
})();
