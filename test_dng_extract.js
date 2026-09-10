/* pic-store.js extractDngPreview 검증 — 합성 DNG(TIFF)로 테스트
 * 구조: IFD0(raw CFA, lossless JPEG strip — 건너뛰어야 함)
 *       + SubIFD(JPEG 프리뷰 60B — 이것을 골라야 함)
 *       + IFD1(old-style JPEG 썸네일 20B — 더 작으므로 제외)
 */
global.window = {};
global.alert = function(){};
require('./pic-store.js');

var LE = true;
function u16(b, off, v){ b.writeUInt16LE(v, off); }
function u32(b, off, v){ b.writeUInt32LE(v, off); }

// 데이터 블록
var rawStrip = Buffer.alloc(100); rawStrip[0]=0xFF; rawStrip[1]=0xD8; // lossless JPEG 흉내
var preview  = Buffer.alloc(60);  preview[0]=0xFF; preview[1]=0xD8; preview[58]=0xFF; preview[59]=0xD9;
for(var i=2;i<58;i++) preview[i]=i; // 식별 가능한 내용
var thumb    = Buffer.alloc(20);  thumb[0]=0xFF; thumb[1]=0xD8; thumb[18]=0xFF; thumb[19]=0xD9;

// 오프셋 계산
var ifd0Off = 8;
var ifd0Size = 2 + 5*12 + 4;            // 5 entries
var subIfdOff = ifd0Off + ifd0Size;     // 74
var subIfdSize = 2 + 4*12 + 4;          // 4 entries
var ifd1Off = subIfdOff + subIfdSize;   // 128
var ifd1Size = 2 + 2*12 + 4;            // 2 entries
var rawOff = ifd1Off + ifd1Size;        // 158
var prevOff = rawOff + rawStrip.length;
var thumbOff = prevOff + preview.length;
var total = thumbOff + thumb.length;

var buf = Buffer.alloc(total);
// 헤더
buf.write('II', 0); u16(buf, 2, 42); u32(buf, 4, ifd0Off);

function entry(b, off, tag, type, cnt, val){
  u16(b, off, tag); u16(b, off+2, type); u32(b, off+4, cnt);
  if(type===3) u16(b, off+8, val); else u32(b, off+8, val);
}

// IFD0: raw IFD (photometric 32803 → 제외 대상)
u16(buf, ifd0Off, 5);
entry(buf, ifd0Off+2,      0x0103, 3, 1, 7);        // Compression = JPEG
entry(buf, ifd0Off+2+12,   0x0106, 3, 1, 32803);    // Photometric = CFA(raw)
entry(buf, ifd0Off+2+24,   0x0111, 4, 1, rawOff);   // StripOffsets
entry(buf, ifd0Off+2+36,   0x0117, 4, 1, rawStrip.length);
entry(buf, ifd0Off+2+48,   0x014A, 4, 1, subIfdOff);// SubIFD
u32(buf, ifd0Off+2+60, ifd1Off);                    // next IFD → IFD1

// SubIFD: JPEG 프리뷰
u16(buf, subIfdOff, 4);
entry(buf, subIfdOff+2,    0x0103, 3, 1, 7);
entry(buf, subIfdOff+2+12, 0x0106, 3, 1, 6);        // YCbCr
entry(buf, subIfdOff+2+24, 0x0111, 4, 1, prevOff);
entry(buf, subIfdOff+2+36, 0x0117, 4, 1, preview.length);
u32(buf, subIfdOff+2+48, 0);

// IFD1: old-style 썸네일
u16(buf, ifd1Off, 2);
entry(buf, ifd1Off+2,      0x0201, 4, 1, thumbOff);
entry(buf, ifd1Off+2+12,   0x0202, 4, 1, thumb.length);
u32(buf, ifd1Off+2+24, 0);

rawStrip.copy(buf, rawOff); preview.copy(buf, prevOff); thumb.copy(buf, thumbOff);

// ArrayBuffer로 변환해 실행
var ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
var out = window.MKPics._extractDngPreview(ab);

var fails = [];
if(!out) fails.push('프리뷰를 찾지 못함 (null 반환)');
else {
  if(out.length !== preview.length) fails.push('길이 불일치: ' + out.length + ' != ' + preview.length);
  else for(var j=0;j<out.length;j++) if(out[j]!==preview[j]){ fails.push('바이트 불일치 @'+j); break; }
}

// 추가 케이스: TIFF가 아닌 파일 → null
var junk = new ArrayBuffer(16);
if(window.MKPics._extractDngPreview(junk) !== null) fails.push('비TIFF 입력에서 null이 아님');

// 추가 케이스: 프리뷰 없는 DNG(raw IFD만) → null
u32(buf, ifd0Off+2+48+8, 0);  // SubIFD 포인터를 0으로
u32(buf, ifd0Off+2+60, 0);    // next IFD도 0으로
var ab2 = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
if(window.MKPics._extractDngPreview(ab2) !== null) fails.push('raw-only DNG에서 null이 아님');

if(fails.length){ console.error('FAIL:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('PASS: 프리뷰 추출(60B 선택, raw/썸네일 제외), 비TIFF null, raw-only null 모두 통과');
