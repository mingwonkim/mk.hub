# Higgsfield 생성 기록

- 시작 잔액: 263.5 credits (balance 실제 조회).
- 사용자 승인: 영상 개수·크레딧 30% 사용 상한 해제. 자동 결제 미승인.
- 진행 규칙: 산출물 한 개마다 사용자 확인 후 다음 생성. 현재 도시 스틸 1장.
- 모델 확인: nano_banana_pro (2k/16:9), 후속 영상 후보 kling3_0 (pro, start_image/end_image).
- 사전 견적: generate_image get_cost=true, nano_banana_pro / 2k / 16:9 / count=1 → 2 credits exact. 제출 전.
- 프로젝트 선호: auto_create_project=false. 프로젝트 생성하지 않음.
- Astra 설계: collaboration /root/city_design, gpt-6-astra/high, 읽기·설계 전용.

## City 01
- Job ID: 738bca4e-354b-4133-a6db-f071dc4d59b9
- Model: nano_banana_pro / resolution=2k / aspect_ratio=16:9 / count=1
- 견적: 2 credits exact, 사용자에게 생성 전 통보 완료.
- 상태: completed. 1장 완료, 사용자 확인 대기. 추가 생성 금지.
- Prompt: Create one cinematic 16:9 establishing still of an immense futuristic metropolis, viewed from a high aerial position between skyscrapers. Monumental dark sculptural skyscrapers frame a clear forward flight corridor leading toward a distinctive mid-distance tower, suitable for a later continuous camera approach. Build strong depth with shadowed foreground architecture, luminous midground subjects, and hundreds of distant towers dissolving into white atmospheric fog. Soft luminous pale pink clouds break up the blue-gray sky. Include a large elegant pearl-white airship at mid-distance, several tiny aircraft for scale, immense illuminated fashion billboards with abstract draped fabric imagery in pearl white and vivid coral, and layered architectural detail suggesting an advanced creative capital. Sophisticated charcoal and blue-black materials, bright pearl-white highlights, restrained rose accents, physically believable cinematic light, crisp focal structures, vast scale. This is an expensive photorealistic architectural film frame, not a game screenshot or illustration. Preserve a quiet lower-left area for future interface text without making the frame empty. The brightest subjects remain clearly separated from the dark city. Balanced airy luminous atmosphere against deep architectural shadows. No interface, no readable text, no logos, no watermark, no sepia grading, no uniform neon wash, no generic all-purple cyberpunk night. Original fictional architecture.

- 반환 모델명: jobs_wait는 nano_banana_2로 반환; 제출 요청/응답 nano_banana_pro와 불일치. 실제 Pro 처리 여부 미확인, 최종 Pro 산출물로 단정하지 않음. 재생성하지 않고 현재 시안 검토.
- 실제 잔액: 261.5 credits, 시작 대비 2 credits 차감.
- 원본: assets/v2/city-01-original.png, 2752×1536.
- 웹 미리보기: assets/v2/city-01.webp, 279898 bytes. cwebp 압축, 새 이미지 생성 아님.
- 원본과 미리보기 보존. 실제 화면으로 어두운 전경/밝은 중앙도시/비행선/전광판/핑크 구름 확인.

## City 02 — 사용자 수정 요청
- 수정: 수 km 초고층·더 높은 카메라·세밀한 좌우 외벽·실제 광고 콘텐츠·도시 밀도.
- 참조: 두 번째 릴스 공개 화면 재확인; 깊은 도시 협곡·미세 불빛·복잡한 전경 구조. 전체 영상 재생 확인은 안 됨.
- Model: gpt_image_2 / resolution=4k / quality=high / aspect_ratio=16:9 / count=1.
- 기존 Nano Banana Pro 요청/반환명 불일치와 1차 디테일 부족 때문에 Higgsfield 내 high 품질 모델로 변경. 저해상도 업스케일 아닌 신규 4K 요청.
- 생성 전 잔액: 261.5. get_cost 견적: 11 credits exact, 사용자 통보 완료.
- Job ID: 89d8873b-0c69-41c4-9399-ea82f1e5b826
- 현재 상태: 제출 완료. 수정 시안 1장만 제출, 완료 후 사용자 확인.
- Prompt: Create ONE extremely detailed, photorealistic cinematic aerial establishing image of an overwhelmingly immense inhabited futuristic megacity, landscape 16:9, maximum 4K high quality.

  The correction is SCALE, ALTITUDE and ARCHITECTURAL MICRODETAIL. Camera hovering 2.5 kilometers above the ground near the upper floors of kilometre-high towers, looking diagonally DOWN 30 degrees across an endless urban abyss. This civilization builds 2 to 5 kilometer tall megastructures, with THOUSANDS of clearly articulated tiny occupied floors. Ordinary 2026 skyscrapers look like tiny subordinate structures far below. Multiple cloud and white mist strata intersect the lower and middle levels of the enormous towers. The street level is lost far beneath; the viewer must viscerally feel vertigo and astronomical vertical scale. City occupies 90 percent of the frame; only a narrow pale rose dusk sky at the upper edge. Three to four overlapping distance layers, legible silhouettes and a clear flight corridor descending toward the mid-distance.

  Foreground left AND right must have exquisite, varied, physically plausible detail, NOT smooth black slabs: millions of small lit and unlit window cells, curtain-wall mullions, layered terraces, inhabited modules, exposed structural outriggers, recessed service galleries, catwalks, elevator shafts, ventilation ribs, pipes and micro-antennae, maintenance gantries, sky gardens and docking platforms. Restrained complex hard-surface architecture with credible engineering. Oblique asymmetrical composition: left a cropped narrow complex tower shoulder, right a taller richly detailed megastructure occupying no more than 20 percent of frame. Do not make two huge blank walls framing one modest tower. Across the middle and distance: a DENSE forest of varied impossibly tall inhabited spires rising from an immense carpet of tiny city lights, stacked transit levels and luminous aerial traffic lanes, with skybridges connecting clusters at different altitudes. Details should stay coherent and sharply resolved when zoomed in, no mush or painterly noise.

  Real illuminated DIGITAL ADVERTISING integrated into buildings: several huge but slender wraparound LED media facades, vertical screens and small ticker bands, visible panel seams and mounting structure, emitted light reflecting on nearby metal. Show convincingly designed fictional advertisements: an editorial portrait of a fictional adult fashion model in a bright coral coat with large clean short words 'FORM / 2096'; another original chrome music synthesizer product ad 'SOUND'; a cyan technical product ad with coherent graphic layout. Mix portrait, product photography, typography and animation-like luminous visual content, NOT generic abstract fabric paintings, not empty white rectangles, not all identical billboards. All people are fictional adults, no real logos or real brands. Ads remain secondary to the enormous city scale.

  One sophisticated enormous airship crossing the middle distance, dwarfed by the megastructures, and many much tinier flying vehicles help establish scale. Dark graphite, deep blue steel and violet-blue atmospheric depth; countless warm amber and coral window lights and brilliant pearl-white/soft cyan signage; occasional luminous pink cloud wisps and white mist create bright relief within the darker city. Beautiful balanced exposure: richly readable shadow detail in foreground, brighter illuminated subjects, selective bloom only around lights, no crushed black facade. Airy white haze only in far distance, not washing out the detailed foreground.

  Premium science-fiction film visual-effects still with physically based materials and intricate lived-in urban detail, refined cinematic lighting, deep focus, immense scale. No cartoon, no illustration, no architectural concept sketch, no plastic toy city, no low-detail game rendering, no generic contemporary skyline, no single smooth central landmark, no enormous empty sky, no interface, no watermark. Original fictional design.

## City 03 — 저비용 방향 확인
- 사용자 요구: 첫 결과물 색감, 더 수평인 시선, 성처럼 뾰족한 실루엣 제거. 먼저 2 credits 저화질 draft 후 승인 시 11 credits 고화질.
- Job ID: 1d7a16c8-ec7a-41ec-9579-2b6482f27356
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1. 반환 표시 모델: nano_banana_2.
- 상태: completed. 원본 1376×768 `assets/v2/city-03-low-original.png`; 미리보기 `assets/v2/city-03-low.webp` 281132 bytes.
- 비용: 2 credits exact. 결과는 수평 시선·둥근 고층·청색/핑크/펄 화이트 색감·광고·비행선을 반영. 사용자 확인 대기. 11 credits 고화질은 승인 전 금지.

## City 04 — 내부와 전광판 강화
- 사용자 요구: City 03에 첫 결과물처럼 더 다채로운 색, City 02처럼 건물 내부가 보이는 구조와 많은 전광판. 완전 수평은 아니며 약한 하향 시선 유지.
- Job ID: 85bafbc1-6e2b-4697-917b-553d59881cd9
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1. 반환 표시 모델: nano_banana_2.
- 상태: completed. 원본 1376×768 `assets/v2/city-04-low-original.png`; 미리보기 `assets/v2/city-04-low.webp` 287072 bytes.
- 비용: 2 credits exact. 다색 조명·개방형 층/실내·전광판 다수·약한 하향 시선 확인. 사용자 확인 대기. 11 credits 고화질은 승인 전 금지.

## City 05 — City 02 색감/실루엣 수정
- 사용자 방향 재설정: City 02를 기준으로 색감만 더 다채롭게 하고 뾰족한 건물 수를 줄임. City 03/04의 수평 구도는 기준에서 제외.
- Job ID: 8e4247b2-6a48-469d-90e5-ad285ec486d4
- Reference: City 02 job 89d8873b-0c69-41c4-9399-ea82f1e5b826
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-05-low-original.png`; 미리보기 `assets/v2/city-05-low.webp` 280208 bytes.
- 비용: 2 credits exact. 사용자 확인 대기. 11 credits 고화질은 승인 전 금지.

## City 06 — 시선 상승
- 사용자 요구: City 05에서 시선을 위로 약 10도, 핑크 하늘을 더 넓게, 상승한 카메라를 따라 프레임 상단 밖으로 이어지는 초고층 건물 몇 개 추가.
- Job ID: 21ed5754-8dbc-41f2-aa1b-a86861c46159
- Reference: City 05 job 8e4247b2-6a48-469d-90e5-ad285ec486d4
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-06-low-original.png`; 미리보기 `assets/v2/city-06-low.webp` 290944 bytes.
- 비용: 2 credits exact. 핑크/라벤더 하늘 확대와 상단을 뚫는 근접 초고층 반영. 사용자 확인 대기. 고화질 생성 금지.

## City 07 — City 05 밝은 색/안개 수정
- 사용자 요구: City 05 상태에서 건물 색상과 안개를 핑크·화이트 등 더 밝게. City 06의 위쪽 시선은 적용하지 않음.
- Job ID: 970118ad-9c89-4af5-937f-54a3b74ae05e
- Reference: City 05 job 8e4247b2-6a48-469d-90e5-ad285ec486d4
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-07-low-original.png`; 미리보기 `assets/v2/city-07-low.webp` 290678 bytes.
- 비용: 2 credits exact. 밝은 표면·핑크/화이트/라벤더 안개와 기존 딥 네이비 대비 반영. 사용자 확인 대기. 고화질 생성 금지.

## City 08 — FAMOUS 대비/좌측 건물 정리
- 사용자 요구: City 07은 전체가 너무 밝고 대비 부족. 왼쪽 철근·나뭇잎이 옛 건물처럼 보임. City 05 기반으로 딥 네이비/차콜 외벽, 선택적 밝은 피사체, 얇은 핑크 대기층으로 재조정.
- Job ID: 437fbf33-825a-4a42-84d3-3a5d835ee7a4
- Reference: City 05 job 8e4247b2-6a48-469d-90e5-ad285ec486d4
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-08-low-original.png`; 미리보기 `assets/v2/city-08-low.webp` 282120 bytes.
- 비용: 2 credits exact. 사용자 확인 대기. 고화질 생성 금지.

## City 12 — City 11 미세 줌아웃
- 사용자 요구: 현재 상태에서 조금만 줌아웃.
- Reference upload: City 11 `assets/v2/city-11-low-original.png` → media_id `d58ad77e-7e12-4881-b130-1917de131e03`.
- Job ID: d20142ba-a142-4bb6-9782-010bff9c6919
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-12-low-original.png`; 미리보기 `assets/v2/city-12-low.webp` 292080 bytes.
- 비용: 2 credits exact. 약 5% 줌아웃 외 변경 금지. 사용자 확인 대기.

## City 10 — 첨부 City 02 직접 편집
- 사용자 요청: 다운로드한 City 02 파일을 직접 첨부해 기존 요청 재반영.
- 원본 업로드: `assets/v2/city-02-rejected.png` → media_id `07cd60cb-acc4-4dce-adb1-80dc2eb8b16c` (Higgsfield confirmed image).
- Job ID: 6dfa6118-b8e7-4480-ad37-f2ba085d46af
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-10-low-original.png`; 미리보기 `assets/v2/city-10-low.webp` 288938 bytes.
- 비용: 2 credits exact. City 02 구도 유지, 둥근 실루엣·핑크 구름·선택적 네온 상승 반영. 사용자 확인 대기. 고화질 생성 금지.

## City 11 — 첨부 City 02 세 가지 변경만
- 사용자 요구: City 02에서 일부 뾰족한 건물만 둥글게, 구름 밝은 몽환 핑크 그라데이션, 전광판만 조금 더 밝게. 나머지 유지.
- Job ID: 4156cdf1-47af-4adc-aa9c-f34b6bb26864
- Reference media: confirmed upload `07cd60cb-acc4-4dce-adb1-80dc2eb8b16c`.
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-11-low-original.png`; 미리보기 `assets/v2/city-11-low.webp` 284982 bytes.
- 비용: 2 credits exact. 사용자 확인 대기. 고화질 생성 금지.

## City 09 — City 02 구름/실루엣/네온 수정
- 사용자 요구: City 02에서 뾰족한 건물 일부를 뭉툭하게, 구름은 연한 핑크로 몽환적 처리, 네온 전광판 등 밝힐 영역만 상승.
- City 02 job reference가 만료되어 404 반환, 비용 차감 없음. 동일 구도·요소를 텍스트로 고정해 재생성.
- Job ID: e91b5ec0-7021-40ff-b725-0d91dba98937
- Model: nano_banana_pro 요청 / resolution=1k / aspect_ratio=16:9 / count=1; 반환 표시 모델 nano_banana_2.
- 상태: completed. 원본 `assets/v2/city-09-low-original.png`; 미리보기 `assets/v2/city-09-low.webp` 290986 bytes.
- 비용: 2 credits exact. 사용자 확인 대기. 고화질 생성 금지.

## City 13 — 전광판 콘텐츠 교체 4K
- 사용자 요구: City 12 기준 오른쪽 전광판을 패션 화보와 Meta Quest VR 글래스 광고로 교체, 왼쪽 전광판을 흰색 신디사이저 건반 광고로 교체. 나머지 구도·색감·건물·구름 유지. 4K, 11 credits.
- Reference upload: City 12 `assets/v2/city-12-low-original.png` → media_id `165dab41-412b-4e32-be8d-552d365bcb21`.
- Job ID: `66035053-1fd4-4b56-8659-85d376050252`.
- Model: `gpt_image_2` / resolution=4k / quality=high / aspect_ratio=16:9.
- 상태: completed. 원본 `assets/v2/city-13-4k-original.png` (3840×2160); 미리보기 `assets/v2/city-13-4k.webp`.
- 비용: 11 credits exact. 오른쪽 패션 화보·Meta Quest, 왼쪽 흰색 신디사이저 광고 반영. 사용자 확인 대기.

## City 14 — 무브랜드 전광판·건반 배경 어둡게·네이티브 4K (확정)
- 사용자 요구: 전광판 기기를 회사 없는 기계로(KORG·Meta Quest 제거), 건반 전광판 흰 배경이 너무 밝음 → 어둡게, 업스케일 느낌 없는 4K로 같은 느낌 재제작.
- Reference: City 13 job `66035053-1fd4-4b56-8659-85d376050252`.
- 모델: nano_banana_pro 4k 시도 → "Requires plus plan" 거절(비용 없음). `gpt_image_2_5` / quality=max / resolution=4k / 16:9 로 생성.
- Job ID: `9ee5d05e-1ebc-43f5-a309-34db6a66ade0`.
- 결과: 무브랜드 신스(짙은 차콜·남색 배경), 무브랜드 VR 헤드셋, 패션 화보 유지. 원본 `assets/v2/city-14-4k-original.png` (3840×2160); 미리보기 `assets/v2/city-14-4k.webp`.
- 비용: 15 credits. 잔액 204.5. 사용자 확정("진짜 좋아").
- 다음 단계(도시 이동 영상) 견적: kling3_0 pro 8s=14 / 4k 8s=48 → starter 플랜 거절(plus 필요). starter 후보 견적 8s: kling3_0 std 12(시안급), grok_video_v15 1080p 64, flux_3_video 1080p 72, veo3_1 preview high 80, seedance_2_5 1080p high 96.

## City 15 — City 14 밝기 상향
- 사용자 요구: City 14가 조금 어두움 → 다시 제작.
- Reference: City 14 job `9ee5d05e-1ebc-43f5-a309-34db6a66ade0`. 노출 +15~20%, 전경 건물 그림자·중간톤 상향, 구름 발광 강화, 나머지 유지.
- Job ID: `d36fa640-19e6-47cb-a83f-3cce835767df`. 모델 `gpt_image_2_5` / max / 4k / 16:9.
- 결과: 원본 `assets/v2/city-15-4k-original.png` (3840×2160); 미리보기 `assets/v2/city-15-4k.webp`. 요청보다 밝기·청색이 더 올라감(전경 건물 푸른 회청색).
- 비용: 15 credits. 잔액 189.5. 사용자 확인 대기.

## City 16 — 고층 상공 대로 1점 투시 시안 (저화질)
- 사용자 요구: 릴스 Dd9PplPMwcJ(malyshev_ai) 같은 시야각 — 고층 상공에서 긴 대로를 소실점 방향으로 내려다봄, 양옆 전광판 벽, 지평선·비행선. City 14 느낌 유지. 4K 말고 저화질.
- 레퍼런스 확인 수준: 두 릴스 모두 og 썸네일 1장만 확인(영상 전체 미확인). 이동수단 레퍼런스 DbtATbSs6Sw = 열기구 바구니 1인칭, 구름 위 거대 타워.
- Reference: City 14 job `9ee5d05e-...` (스타일만).
- Job ID: `6cd48ed6-b30c-4a1a-bfd3-ebc8c2a9b941`. 요청 nano_banana_2 / 1k / 16:9, 반환 표시 모델 nano_banana_flash.
- 결과: 원본 `assets/v2/city-16-low-original.png` (1376×768); 미리보기 `assets/v2/city-16-low.webp`.
- 비용: 1.5 credits. 잔액 188. 사용자 확인 대기.

## City 17~19 — 완전 신규 구도 시안 3종 (저화질)
- 사용자 요구: City 16 대신 아예 새로, 구도도 다르게. 고층 상공 시야, City 14 색감 유지, 저화질.
- 공통: nano_banana_2 / 1k / 16:9 (반환 nano_banana_flash), City 14 job 색감·세계관 참조만. 각 1.5 credits, 합 4.5. 잔액 183.5.
- City 17 `88f004aa-2663-4a8b-975e-e06f14927d37`: 꼭대기 유리 스카이덱 가장자리에서 협곡 내려다봄(유리 난간·다리 프레임). 실제 결과는 60° 하향보다 완만, 기존 14 건물 재사용 느낌 강함.
- City 18 `29fe56b0-b6a2-4998-a816-97d741da2493`: 좌측 거대 원통 타워 근접 + 우측 분홍 구름바다 위 타워들·비행선들. 가장 몽환적·여백 많음.
- City 19 `cab16478-c556-4f7e-a78f-c945b28f530c`: 구름 위 공중 원형 링 플라자 + 방사형 다리, 흰 비행선 도킹. 가장 밀도·정보량 많음.
- 파일: `assets/v2/city-1{7,8,9}-low-original.png`, `.webp`. 사용자 선택 대기.

## City 20 — City 18 구도 + 아래 도시 디테일 + 광고 교체 (저화질)
- 사용자 요구: 광고 사진 아무 다른 사진으로, City 18 색감·구도 유지, 아래 건물이 릴스 DZKZdpOT40c(metronovon)처럼 디테일하게 보이게.
- Reference: City 18 job `29fe56b0-...`. 구름바다를 얇은 핑크 안개로 → 아래 거대 도시(가로·광장·빛줄기) 노출. 광고: 향수·운동화·VR·꽃 정물(무브랜드).
- Job ID: `eac12572-8e59-4dc8-9701-fef884cada07`. nano_banana_2 요청 / 1k (반환 nano_banana_flash). 1.5 credits, 잔액 182.
- 파일: `assets/v2/city-20-low-original.png`, `.webp`. UI 프로토타입 배경으로 사용(`prototype/city-hub.html`).

## Balloon 01 — 열기구 탑승 시점 시안 (빈 바구니, 저화질)
- 레퍼런스 재확인: 릴스 DbtATbSs6Sw(malyshev_ai) 8초 영상 전체 프레임 확인(yt-dlp). 열기구 위·뒤에서 거의 수직 하향, 하단 빨간 엔벨로프·바구니(사람+개), 아래로 구름 속 거대 타워, 비 사선, 카메라 이동 거의 없음.
- 사용자 결정: 사람·동물 없이 빈 바구니.
- Reference: City 20 job `eac12572-...` (세계관·색감만).
- Job ID: `7100325d-0c30-4ce7-9d03-c1dd1f49f47f`. nano_banana_2 / 1k (반환 nano_banana_flash). 1.5 credits, 잔액 180.5.
- 결과: `assets/v2/balloon-01-low-original.png`, `.webp`. 문제: 위·아래에 엔벨로프가 두 개처럼 그려져 물리적으로 어색(바구니가 위 엔벨로프에 매달림).

## Balloon 02~04 — 엔벨로프 하나로 수정
- 02 `a0f5870a-8d34-4b6f-b1a9-8ff3a26a6d81` (nano_banana_2 편집, 1.5): 원본과 거의 동일, 실패.
- 03 `9cb00266-a0e7-4d5d-8fd3-9021058496c7` (nano_banana_2 신규, City 20 참조, 1.5): 여전히 엔벨로프 2개, 실패.
- 04 `483e3fd8-e5c5-411a-8d45-0a2ff0a63cb9` (gpt_image_2_5 / 1k / medium, City 20 참조, 0.5): 엔벨로프 1개, 위에서 내려다본 돔 + 그 너머 빈 바구니, 아래 타워(VR·향수 광고)·구름·도시·비행선. 채택 후보.
- 교훈: 구조 지시(개수·위치)는 nano_banana 계열이 무시 → gpt_image_2_5 저화질(0.5)이 더 싸고 정확.
- 합계 3.5 credits, 잔액 177.

## City 21 — City 20 용도별 광고 + 네이티브 4K (메인 화면)
- 사용자 요구: City 20 전광판 중 갤러리(꽃 정물)는 유지, 나머지를 용도에 맞는 광고로 새로 생성, 업스케일 없이 4K 신규 생성.
- 광고: Vault=크리스탈 볼트 큐브 안 떠다니는 파일·폴더 / Brief=신문·커피 든 배달 드론과 일출 / Music=헤드폰·신스·믹싱 콘솔 스튜디오 / Gallery=꽃 정물 유지.
- Reference: City 20 job `eac12572-...`. Job ID `918b87b5-fe08-4578-869d-bacff58882e7`. gpt_image_2_5 / max / 4k / 16:9.
- 결과: 원본 `assets/v2/city-21-4k-original.png` (3840×2160); 미리보기 `assets/v2/city-21-4k.webp` (1920, 254KB). 광고판 위치 City 20과 동일 → 프로토타입 배경 교체, 핫스팟 좌표 그대로.
- 비용: 15 credits. 잔액 162.

## City 22 — 참조 없이 텍스트만으로 4K 신규 생성
- 사용자 요구: 작곡 스튜디오 광고 화이트·베이지톤, 전체 화질 개선(참조 편집보다 신규 생성이 유리), 같은 고도에 드론 2·비행선 1.
- 방식: 참조 이미지 없이 프롬프트만. gpt_image_2_5 / max / 4k / 16:9. Job `6f4ea49b-cd17-4a99-9407-b1a4cb41e3f1`.
- 결과: 화질·디테일 크게 개선. 화이트·베이지 스튜디오, 드론 2·대형 비행선 1 카메라 고도. 차이: 타워가 더 가깝고 광고판이 커짐, 노을 채도↑, 아래 타워들이 높아 City 21보다 고도감은 낮음.
- 파일: `assets/v2/city-22-4k-original.png`, `.webp`(1920, 236KB). 프로토타입 배경 교체·핫스팟 재측정.
- 비용: 15 credits. 잔액 147.
