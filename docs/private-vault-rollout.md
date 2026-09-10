# 개인 저장고 보안 전환 — 현재: Firebase 이메일 링크

## 최신 결정과 운영 상태

사용자 선택으로 네이버 SMTP와 숫자 인증번호를 폐기. Firebase가 `kmin5940@naver.com`으로 인증 링크 발송. 네이버 앱 비밀번호와 2단계 인증 설정 불필요. GitHub 토큰도 기본 저장/로그인에는 불필요하며 추가 백업을 선택할 때만 사용한다.

- 이메일 링크 로그인 활성화, 실제 민권.com 도메인 허용 완료.
- `vault` 서버 생성 완료. 비인증 pin-state 요청은 운영 서버에서 401 확인.
- 링크는 서버에서 Firebase `signInWithEmailLink` API로 소비한 뒤 소유자 이메일 확인. 클라이언트가 다른 수신자나 복귀 주소를 정할 수 없음.
- 링크 확인만으로 자료 접근 불가. 서버 암호 설정/확인 뒤 접근 권한 부여. 기존 1~3단계 암호와 문서 경로 유지.
- URL 인증 코드는 읽은 직후 제거. 만료/재사용 링크는 거절하고 새 링크 발송 제공.
- `vault_otp_at` 필드는 규칙 호환을 위해 유지하며 현재 의미는 이메일 링크 확인 시각. 자동 생성한 `VAULT_OTP_PEPPER`는 서버 발송 제한용 HMAC 키로 재사용.
- SMTP 코드와 nodemailer 의존성 제거. 바탕화면의 필수 비밀값 등록 도구 삭제.
- `VAULT_GITHUB_ENABLED=false`가 기본값. GitHub 함수는 true일 때만 배포 대상으로 내보내므로 인증 서버에 GitHub 토큰이 필요하지 않음.
- `security/register-secrets.py`는 나중에 추가 백업을 선택한 관리자의 GitHub 토큰 등록용. SMTP 입력 없음.
- 서버 테스트 10개, 브라우저 테스트 8개, 규칙 테스트 5개 통과. Auth emulator에서 실제 EMAIL_SIGNIN 발행/소비와 email_verified 확인.

다음 순서: main 화면 반영 → 실제 메일 발송 → 사용자가 링크 확인/저장고 암호 최초 등록 → 소유자 접근 확인 → 운영 규칙/파일 토큰 전환. 사용자 배포 승인은 이미 받았으며 재요청하지 않는다.

Firebase 발송 방식 근거: [공식 이메일 링크 인증 안내](https://firebase.google.com/docs/auth/web/email-link-auth).

---

아래는 전환 이력. **아래 SMTP 등록 절차와 GitHub 필수 등록 요구는 폐기됐으며 실행하지 않는다.** 백업 경로, 저장 보존 원칙, 테스트 실행 방법은 계속 유효하다.

**구현·로컬 검증 완료, 운영 배포 전.** SMTP 자격증명이 없으므로 실제 인증 메일은 아직 발송되지 않는다. GitHub 서버 토큰도 미등록. 운영 Firestore/Storage 규칙·기존 파일 토큰은 변경하지 않았다.

## 확인한 운영 문제

2026-09-10 읽기 전용 점검: Firestore의 `mk_app` 경로와 Storage 전체가 `request.auth != null`이면 읽기/쓰기를 허용했다. 기존 프런트엔드는 익명 로그인을 사용했다. 따라서 화면의 폴더 잠금과 별개로 익명 인증 계정이 자료에 접근할 수 있었다. [Firebase의 안전하지 않은 규칙 안내](https://firebase.google.com/docs/rules/insecure-rules)

기존 다운로드 URL에 포함된 Firebase Storage 토큰도 별도 접근 수단이다. 규칙 배포만으로 기존 공유 링크가 폐기되는 것으로 간주하면 안 된다.

## 구현 범위

- 수신자 `kmin5940@naver.com` 서버 상수. 브라우저에서 다른 주소를 보내도 변경 불가.
- 인증번호 6자리, 유효시간 5분, 실패 5회, 한 번 사용 후 폐기. IP당 시간당 5회·전체 시간당 10회·60초 재발송 간격. OTP 원문 저장 없음.
- 메일 확인 후 서버에서 1~3단계 암호 검증. salt+scrypt 저장, 한국어 정규화, IME·보기 버튼·중복 제출 오류 수정.
- 이메일 인증만으로 개인 자료 접근 불가. 소유자 이메일·확인 상태·서버 발급 권한·12시간 만료·서버 버전을 규칙에서 검사.
- 암호 변경 또는 모든 기기 잠금 시 버전 증가로 기존 DB/Storage 세션 차단. 사용자별 서버 권한은 [Firebase custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens) 사용.
- GitHub PAT·레포지토리·경로 입력칸 제거. 브라우저에 남아 있던 `mk_gh_pat/repo/path` 제거. 서버는 고정된 비공개 레포지토리만 허용하고 Secret Manager의 토큰을 사용한다. 클라이언트는 메모 ID만 전송한다.
- 새 파일 참조는 `mk-private:경로`; 인증된 `getBlob`으로 다운로드. 기존 Firebase URL도 동일 경로로 변환해 읽는다. [Storage 직접 다운로드와 CORS](https://firebase.google.com/docs/storage/web/download-files)
- 코드 미리보기는 `allow-same-origin` 제거. 업로드된 HTML 첨부는 다운로드하며 개인 저장고와 같은 출처에서 실행하지 않는다.
- 파일/문서 경로 유지. 실제 데이터·사진 슬롯 삭제 없음. 메모 그림은 새 경로 업로드→문서 저장 성공→옛 파일 정리 순서.

서버는 복호화 가능한 원문 자료를 취급한다. 종단간 암호화 구현은 아니다. 갤러리·학습 앱의 기존 브라우저 저장 자료는 기기 로컬 자료이며 서버 인증이 기기 접근 자체를 차단하지 않는다.

## 필요한 외부 설정

1. 네이버 계정에서 2단계 인증·SMTP 사용을 설정하고 앱 비밀번호 발급. 일반 로그인 비밀번호 사용 불가. [네이버 공식 SMTP 안내](https://help.naver.com/service/30029/contents/21341?lang=ko&osType=PC)
2. 앱 비밀번호를 채팅·코드에 남기지 않고 아래 CLI의 비공개 입력 프롬프트에 등록.
3. GitHub 백업을 사용할 경우 기존 브라우저 토큰을 폐기하고 `mingwonkim/obsidian-vault` 한 저장소의 Contents 읽기/쓰기 권한만 가진 새 토큰을 서버에 등록. 해당 레포지토리는 점검 시 PRIVATE였다. 백업 연결 실패는 메모의 Firestore 저장을 취소하지 않는다.

프로젝트 루트에서 실행하는 운영 준비 명령(이번 작업에서 실행하지 않음):

```sh
npm ci --prefix functions
npx firebase-tools@15.30.0 functions:secrets:set VAULT_SMTP_PASSWORD --project mingwon-hub
openssl rand -hex 32 | npx firebase-tools@15.30.0 functions:secrets:set VAULT_OTP_PEPPER --data-file - --project mingwon-hub
npx firebase-tools@15.30.0 functions:secrets:set VAULT_GITHUB_TOKEN --project mingwon-hub
```

비밀값은 함수에 명시적으로 연결했다. 일반 `.env`에 PAT/SMTP 비밀번호를 쓰지 않는다. [Firebase Secret Manager 연동](https://firebase.google.com/docs/functions/config-env)

일반 서버 매개변수 기본값: SMTP `smtp.naver.com:465`(TLS), 사용자 고정 이메일, GitHub `mingwonkim/obsidian-vault`, 경로 빈 값. 필요하면 관리자만 Functions 배포 매개변수로 변경한다. Functions와 Storage 버킷의 실제 리전은 모두 `asia-northeast3`.

## 운영 전환 순서

1. 현재 데이터 백업과 외부 Brief 작성 프로그램의 인증 방식 확인. 새 규칙은 익명 클라이언트를 모두 차단하므로 외부 작성기는 적절한 관리자 서비스 계정 방식이어야 한다.
2. SMTP·OTP 비밀값 등록 후 `vault` 함수 먼저 배포. 실제 메일 수신→인증번호 확인→서버 암호 최초 등록 검증. 기존 로컬 암호 해시는 서버로 복사하지 않으므로 한 번 새로 등록한다.
3. 새 UI의 로컬 미리보기에서 실제 소유자 로그인 검증. GitHub 기능은 별도 토큰 등록 후 `vaultGithub` 배포·비공개 메모 하나로 읽기/쓰기 검증.
4. Storage CORS 적용. 새 프런트엔드와 소유자 전용 규칙을 같은 전환 작업에서 반영. 구 프런트엔드는 새 규칙에서 읽을 수 없다.
5. `sealPrivateUpload` 배포 후 신규 업로드→문서 저장→인증 다운로드 검증. 기존 파일 토큰 제거 도구는 먼저 dry-run, 이어 `--apply`. 파일 내용·경로를 변경하지 않고 공유 다운로드 토큰만 폐기한다.
6. 로그아웃·다른 계정·만료 세션·옛 다운로드 URL 차단, 소유자 메모/그림/파일 저장 복원, Brief 수신까지 확인.

```sh
npx firebase-tools@15.30.0 deploy --only functions:vault:vault --project mingwon-hub
npx firebase-tools@15.30.0 deploy --only functions:vault:vaultGithub --project mingwon-hub
# Google Cloud CLI + 관리자 로그인 필요; 소유자 인증 검증 후 실행
gcloud storage buckets update gs://mingwon-hub.firebasestorage.app --cors-file=security/storage-cors.json
npx firebase-tools@15.30.0 deploy --only firestore:rules,storage,functions:vault:sealPrivateUpload --project mingwon-hub
# Application Default Credentials 필요. 기본값은 조회만 수행.
NODE_PATH=./functions/node_modules node security/seal-existing-files.cjs
NODE_PATH=./functions/node_modules node security/seal-existing-files.cjs --apply
```

프런트엔드는 `design/woodland-interactive` 사용자 시안 검토 후 main 병합. 실메일 확인 전에 규칙부터 교체하면 소유자도 잠길 수 있어 이번 작업에서는 운영 전환하지 않았다. 기존의 느슨한 규칙으로 되돌리는 것은 보안 복구 방식으로 사용하지 않는다.

GitHub 동기화는 텍스트 기록용. 그림 원본은 개인 저장고 링크로 표시하며 첨부 파일 전체 백업 기능은 아니다. 서버 동기화는 3개씩 나눠 처리하며 가져오기 재시도에서 외부 문서 경로로 생성한 ID를 재사용한다.

## 재현 검증

Node 22, Java 21, 로컬 HTTP 서버 필요. 아래 테스트는 운영 DB에 쓰거나 메일을 보내지 않는다.

```sh
npm ci --prefix functions
npm ci --prefix tests
./tests/node_modules/.bin/playwright install chromium webkit
python3 -m http.server 8766 --bind 127.0.0.1
# 다른 터미널: demo 프로젝트만 사용
npx firebase-tools@15.30.0 emulators:start --only firestore,storage,auth --project demo-mkhub --config firebase.json
# 다른 터미널: 서버/규칙 테스트는 동일 emulator 상태를 쓰므로 순서대로 실행
NODE_PATH=./tests/node_modules:./functions/node_modules node --test functions/security.test.cjs
NODE_PATH=./tests/node_modules:./functions/node_modules node --test tests/vault-server.cjs
NODE_PATH=./tests/node_modules:./functions/node_modules node --test tests/security-rules.cjs
NODE_PATH=./tests/node_modules node --test tests/memo-auth-regression.cjs tests/vault-client.cjs
```

완료: 메모/파일/기존 암호 11개, 서버 헬퍼 5개, 서버 트랜잭션/백업 6개, 보안 규칙 5개, 브라우저 인증/커서/실제 CSP 8개. 총 35개 통과. 서버 테스트의 메일·Auth는 대역이며 실제 SMTP·운영 custom token 로그인은 외부 설정 후 확인해야 한다.

서버 의존성 감사: `uuid` 간접 의존성을 CommonJS 지원 패치 버전 11.1.1로 고정. 호출부는 v4 사용 확인, Functions 재설치 후 npm audit 0건. [수정 근거](https://github.com/advisories/GHSA-w5hq-g745-h8pq)

## 실제 전환 진행 상태

사용자가 운영 전환 진행 승인. 배포 승인 재요청 불필요. 소유자 실제 메일 인증 확인 전 접근 규칙과 다운로드 토큰 폐기는 실행하지 않는다.

- Secret Manager `VAULT_OTP_PEPPER` 버전 1 등록. SMTP/GitHub 비밀값은 아직 없음.
- Functions, Build, Artifact Registry, Run, Eventarc, Pub/Sub, IAM Credentials API 활성화.
- `mkhub-vault@mingwon-hub.iam.gserviceaccount.com` 전용 실행 계정 생성. 프로젝트 DB/Auth 권한, 해당 버킷 파일 관리 권한, 자기 계정 서명 권한 추가. 서비스 계정 키 파일 생성 없음.
- Storage CORS 적용. 기존 접근 규칙과 다운로드 토큰 유지.
- Firestore 141문서와 파일 36개(793245896바이트) 로컬 백업. 파일별 용량 확인과 SHA256 기록. 위치: `~/.local/share/mk-hub/backups/2026-09-10T08-42-42-689Z`. 디렉터리 0700, 파일 0600.
- Brief 작성기는 Admin SDK 서비스 계정 사용으로 새 클라이언트 규칙과 구조상 호환. 전환 후 수신 확인은 남음.

### 남은 비밀값 등록

바탕화면 `MK.HUB 서버 비밀값 등록.command` 실행. 소스는 `security/register-secrets.py`. 숨김 입력으로 받아 SMTP 로그인 및 지정한 비공개 레포 접근을 확인하고 Secret Manager에 등록한다. 입력값은 파일이나 명령 인수로 저장하지 않는다. 등록된 항목은 건너뛴다.

- 네이버: [SMTP 공식 안내](https://help.naver.com/service/30029/contents/21341?lang=ko&osType=PC). 2단계 인증과 앱 비밀번호 필요.
- GitHub: [fine-grained 토큰 생성](https://github.com/settings/personal-access-tokens/new). `mingwonkim/obsidian-vault`만 선택, Repository permissions의 Contents를 Read and write로 지정.
- 비밀값을 채팅에 보내지 않는다. 완료 상태만 알려주면 함수 배포, 실제 메일, 소유자 로그인, 규칙과 화면 전환을 계속한다.

전환 준비 검증: Python 구문 검사, 서버 헬퍼 5개 통과, Cloud API로 서비스 계정과 활성 API, Secret 목록 확인. 사용자 비밀값 입력과 실메일 검증은 미완료.
