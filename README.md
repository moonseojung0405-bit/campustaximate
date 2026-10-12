# 학교 같이타

어천역·초지역에서 화성의과학대학교로 가는 택시 동승 웹앱입니다.

- 가입은 선택입니다. **비회원으로 이용하기**로 모집·참여·채팅을 이용할 수 있습니다. 비회원 기록은 같은 브라우저의 쿠키로 연결되므로 쿠키 삭제 또는 브라우저 변경 시 다시 접근할 수 없습니다.
- 직접 정하는 아이디(영문·숫자·밑줄 4~20자) + 숫자 4자리 비밀번호로 가입·로그인할 수도 있습니다. 같은 브라우저에서 처음 가입하면 비회원 모집과 채팅이 계정에 연결됩니다. 채팅 닉네임은 로그인 아이디와 별도로 정합니다.
- 모집자 포함 정원 4명, 출발 예정 시각부터 최대 10분 대기.
- 참여자 전용 채팅, 2분/5분 지각 및 도착 메시지, 참여 취소와 모집 취소.
- 예상 총 요금은 작성자가 입력합니다. 실제 탑승 인원과 최종 요금으로 직접 정산합니다.
- 출발 시각은 한국 시간입니다. 모집은 7일 이내로 만들 수 있습니다.
- 학교 공식 서비스나 재학생 인증 서비스가 아닙니다. 택시 호출·결제 기능은 없습니다.

## 실행

Node.js 24 및 npm을 사용합니다. 현재 실행 환경은 **Next.js + Vercel + Neon PostgreSQL**입니다.
Vercel의 `campustaximate` 프로젝트에 연결한 Neon 데이터베이스가 `DATABASE_URL`을 제공합니다.
새 컴퓨터에서는 다음과 같이 설정합니다. 환경변수 파일과 `.vercel/`은 Git에서 제외됩니다.

```
npm ci
vercel link
vercel env pull .env.local --environment development
npm run db:migrate
npm run dev
```

개발 주소는 `http://localhost:5173`입니다. 배포는 GitHub `main` 브랜치 push로 실행됩니다.
`npm run build`는 Vercel이 요구하는 `.next` 결과물을 생성합니다. 최초 DB 연결 후 `npm run db:migrate`로 스키마를 준비합니다. 이 명령은 기존 테이블을 삭제하지 않습니다.
`.openai/`, `build/`, `vite.config.ts`, `drizzle/`의 기존 파일은 이전 Sites/Cloudflare 구성 참고용이며 Vercel 런타임에서 사용하지 않습니다. 기존 Sites D1 데이터는 Neon으로 자동 이전되지 않습니다.

## 검증

- `node node_modules/typescript/bin/tsc --noEmit`
- `npm run build`
- 로컬 서버 실행 후 `node --env-file=.env.local scripts/verify-vercel.mjs`: 실제 PostgreSQL 연결에서 비회원 이용, 가입·로그인, 세션 폐기, 동시 참여 정원 4명, 참여자 전용 채팅, 취소를 검증하고 해당 실행이 만든 데이터만 삭제합니다. `TEST_BASE_URL`로 배포 주소를 지정할 수 있습니다. 환경변수의 DB와 테스트 대상 서버의 DB가 같아야 합니다.
- `scripts/verify-accounts.mjs`는 이전 D1 로컬 환경 전용 검증입니다. Vercel 환경에서는 위의 `verify-vercel.mjs`를 사용합니다.
- `scripts/verify-ui.mjs`: 작성 환경의 Playwright/Edge로 PC·모바일에서 등록/대화/저장/취소/화면 넘침을 확인합니다. 실행 환경이 바뀌면 스크립트 상단 경로를 수정합니다.
- WebMCP 조회 도구는 지원 브라우저에서만 등록됩니다. 현재 검증 브라우저는 해당 API를 제공하지 않아 네이티브 WebMCP 동작은 미검증입니다.

모집·메시지는 PostgreSQL에 저장됩니다. 참여 처리는 모임별 트랜잭션 잠금으로 직렬화해 여러 서버에서 동시에 참여해도 정원을 넘지 않게 합니다. 같은 아이디와 비밀번호로 다른 기기에서도 기존 모집·채팅을 이용할 수 있습니다. 가입 시 현재 브라우저의 이전 방문자 기록을 계정에 연결합니다. 로그인 세션은 최대 180일 유지되며 로그아웃하면 해당 기기의 세션만 폐기합니다. 채팅은 화면이 열려 있을 때 4초마다, 모집 목록은 10초마다 갱신됩니다. 채팅에는 최근 100개 메시지가 표시됩니다.

## 계정 기능

비밀번호는 임의의 salt와 PBKDF2-SHA256 100,000회로 해싱해 저장합니다. 세션 토큰의 해시만 DB에 저장하고 브라우저 쿠키에는 HttpOnly, SameSite=Lax 및 HTTPS Secure 속성을 적용합니다. 15분 동안 아이디별 로그인 시도 10회, 접속 IP별 계정 요청 60회 제한이 있습니다. 성공한 로그인은 아이디별 시도 기록을 초기화합니다. 비밀번호 분실 복구는 지원하지 않습니다. 학번은 수집하지 않습니다.

PostgreSQL 초기 스키마는 `db/migrations/001_initial.sql`, 타입 선언은 `db/schema.ts`에 있습니다. `db:generate`는 새 변경안만 `db/generated/`에 생성하며 자동 적용하지 않습니다. 기존 D1 SQL 마이그레이션을 PostgreSQL에 실행하지 마세요.
