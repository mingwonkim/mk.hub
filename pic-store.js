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

  function readAsDataURL(blob){
    return new Promise(function(res,rej){
      var r=new FileReader();
      r.onload=function(){res(r.result);};
      r.onerror=function(){rej(r.error);};
      r.readAsDataURL(blob);
    });
  }

  /* DNG(TIFF 구조) 안의 내장 JPEG 프리뷰를 찾아 Uint8Array로 반환. 없으면 null.
   * raw IFD(CFA/LinearRaw)의 lossless JPEG은 <img>로 못 그리므로 제외하고,
   * 프리뷰 IFD들 중 가장 큰 JPEG 스트림을 고른다. */
  function extractDngPreview(buf){
    var dv=new DataView(buf);
    if(dv.byteLength<8)return null;
    var b0=dv.getUint16(0,false),le;
    if(b0===0x4949)le=true; else if(b0===0x4D4D)le=false; else return null;
    if(dv.getUint16(2,le)!==42)return null;
    var SZ={1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8,11:4,12:8};
    function vals(e,type,cnt){
      var sz=(SZ[type]||1)*cnt,p=sz<=4?e+8:dv.getUint32(e+8,le),out=[],i;
      if(p+sz>dv.byteLength)return out;
      for(i=0;i<cnt;i++){
        if(type===3)out.push(dv.getUint16(p+i*2,le));
        else if(type===4)out.push(dv.getUint32(p+i*4,le));
        else if(type===1)out.push(dv.getUint8(p+i));
        else out.push(0);
      }
      return out;
    }
    var best=null,seen={};
    function walk(off,depth){
      if(depth>4||!off||off+2>dv.byteLength||seen[off])return;
      seen[off]=1;
      var n=dv.getUint16(off,le),tags={},i;
      if(off+2+n*12+4>dv.byteLength)return;
      for(i=0;i<n;i++){
        var e=off+2+i*12,tag=dv.getUint16(e,le);
        if(tag===0x0103||tag===0x0106||tag===0x0111||tag===0x0117||tag===0x014A||tag===0x0201||tag===0x0202)
          tags[tag]=vals(e,dv.getUint16(e+2,le),dv.getUint32(e+4,le));
      }
      var photo=tags[0x0106]?tags[0x0106][0]:0;
      if(photo!==32803&&photo!==34892){ /* raw IFD 제외 */
        var cand=null;
        if(tags[0x0201]&&tags[0x0201].length&&tags[0x0202]&&tags[0x0202].length)
          cand=[tags[0x0201][0],tags[0x0202][0]];
        else if(tags[0x0103]&&(tags[0x0103][0]===6||tags[0x0103][0]===7)&&
                tags[0x0111]&&tags[0x0111].length===1&&tags[0x0117]&&tags[0x0117].length)
          cand=[tags[0x0111][0],tags[0x0117][0]];
        if(cand){
          var s=cand[0],l=cand[1];
          if(l>2&&s+l<=dv.byteLength&&dv.getUint16(s,false)===0xFFD8&&(!best||l>best[1]))best=cand;
        }
      }
      if(tags[0x014A])tags[0x014A].forEach(function(o){walk(o,depth+1);});
      walk(dv.getUint32(off+2+n*12,le),depth+1);
    }
    walk(dv.getUint32(4,le),0);
    return best?new Uint8Array(buf,best[0],best[1]):null;
  }

  function isDng(file){
    return /\.dng$/i.test(file.name||'')||/dng/i.test(file.type||'');
  }

  /* 파일 → 원본 dataURL (압축·축소 없음 — 원본 화질 그대로 저장)
   * DNG는 브라우저가 직접 못 그리므로 내장 JPEG 프리뷰를 추출해 JPEG dataURL로 변환 */
  function fileToDataURL(file){
    if(!isDng(file))return readAsDataURL(file);
    return new Promise(function(res,rej){
      var r=new FileReader();
      r.onload=function(){
        var jpg=extractDngPreview(r.result);
        if(jpg)res(readAsDataURL(new Blob([jpg],{type:'image/jpeg'})));
        else{alert('DNG 변환 실패: 내장 JPEG 미리보기가 없는 파일입니다.');rej(new Error('no dng preview'));}
      };
      r.onerror=function(){rej(r.error);};
      r.readAsArrayBuffer(file);
    });
  }

  window.MKPics={get:get,set:set,getMany:getMany,fileToDataURL:fileToDataURL,_extractDngPreview:extractDngPreview};
})();
