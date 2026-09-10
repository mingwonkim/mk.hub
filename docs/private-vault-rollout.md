# 개인 저장고 보안 전환

## 현재 인증 방식

Firebase가 고정 수신자에게 이메일 인증 링크를 보낸다. 네이버 SMTP·2단계 인증·앱 비밀번호 등록은 필요 없다. GitHub 토큰도 로그인에 필요 없다.

- 수신자: `kmin5940@naver.com`, 클라이언트가 변경 불가.
- Firebase 일회용 링크를 서버에서 소비하고 이메일 확인 후 저장고 암호 등록/검증으로 연결.
- 저장고 암호는 기존 앱 접근용이며 네이버 계정의 추가 비밀번호가 아니다. 서버에서 salt+scrypt 검증.
- 이메일 인증만으로 자료 접근 불가. 소유자·12시간 세션·서버 버전과 저장고 접근 권한을 검사.
- 링크 비밀값은 주소 표시줄에서 제거. 인증 링크나 비밀번호를 채팅에 공유하지 않는다.
- 기존 `VAULT_OTP_PEPPER`는 메일 요청 IP 식별용 서버 비밀값으로 유지; 사용자가 등록할 항목 없음.

## 운영 확인 — 2026-09-10

- 이메일 링크 인증 서버·최신 main 배포 완료(기존 작업 기록 및 코드 확인).
- 운영 `mk_security/access` 문서 존재·갱신 시각 확인: 2026-09-10 14:35:57 UTC. 비밀번호 필드는 조회하지 않음.
- 운영 Firestore 소유자 전용 규칙 배포 확인: 2026-09-10 14:39:25 UTC. 이전 익명 인증 허용 규칙은 교체됨.
- 브리핑 iframe은 `sandbox="allow-popups allow-popups-to-escape-sandbox"`로 스크립트 차단.
- Brief 추가 규칙: 소유자 읽기·삭제·boolean `read` 변경만 허용. 클라이언트 생성·본문·URL 변경 차단. Admin SDK 작성기는 Rules 적용 대상 아님.
- Storage 소유자 전용 규칙 적용. 운영 비인증·익명 계정의 DB/파일 요청 4건 모두 403 확인.
- 기존 개인 파일 33개의 공유 다운로드 토큰 폐기 완료. generation/MD5/size 무변경, 옛 URL 33개 모두 차단 확인.
- `sealPrivateUpload` 운영 ACTIVE. 별도 임시 업로드의 토큰 자동 제거·내용 유지 확인 후 테스트 파일 삭제.
- 이벤트 계정은 전용 mkhub-vault. 버킷 metadata 조회·Eventarc 수신·해당 Cloud Run 서비스 호출 권한만 추가. [Eventarc 권한 안내](https://docs.cloud.google.com/eventarc/standard/docs/run/create-trigger-storage-gcloud?hl=en)

## 브리핑 규칙 검증·배포

포괄 mk_app 규칙에서 briefs를 제외해야 전용 제한이 적용된다. 겹친 match 중 하나라도 허용하면 요청이 통과하기 때문이다. [Firebase 규칙 구조](https://firebase.google.com/docs/firestore/security/rules-structure), [변경 필드 제한](https://firebase.google.com/docs/firestore/security/rules-fields).

```sh
npm ci --prefix tests
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home npx firebase-tools@15.30.0 emulators:exec --only firestore,storage --project demo-mkhub 'node --test tests/brief-rules.cjs && node --test tests/security-rules.cjs'
npx firebase-tools@15.30.0 deploy --only firestore:rules --project mingwon-hub
```

소유자 인증 완료·운영 owner() 규칙 반영 후 Brief 제한만 추가한다. 실제 배포 결과는 todo.md에 기록한다.

## 남은 별도 점검

- 소유자 브라우저의 기존 그림/파일 열기는 사용자 확인 응답 대기. 서버 암호 등록 완료는 사용자 응답과 access.version=1로 확인.
- IAM의 브리핑 작성 계정 식별 필요. GitHub Secret은 원문 조회 불가하므로 기존 발급 파일의 `client_email`만 확인하고 공유 계정 역할을 무작정 제거하지 않는다.
- GitHub 추가 백업은 선택 기능이며 `VAULT_GITHUB_ENABLED=false`가 기본. 켤 때만 `mingwonkim/obsidian-vault`의 Contents 읽기/쓰기 토큰을 서버에 등록한다.
- Discord 알림은 morning-brief 저장소의 `DISCORD_WEBHOOK_URL` 등록 시 활성화.

## 복구 자료·이전 검증

- 운영 전환 전 백업: Firestore 141문서·파일 36개(793245896바이트).
- 위치: `~/.local/share/mk-hub/backups/2026-09-10T08-42-42-689Z`, 디렉터리 0700·파일 0600, 용량·SHA256 기록.
- 전용 런타임 `mkhub-vault` 사용, Storage CORS 적용, 새 파일의 다운로드 토큰 제거 트리거 구현.
- 기존 작업에서 링크 인증 서버·브라우저·규칙 및 main 병합 회귀 검증 완료. 이번 작업의 재실행 결과는 todo.md 참조.
