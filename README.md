# 학교 같이타

어천역·초지역에서 화성의과학대학교로 가는 택시 동승 웹앱입니다.

- 로그인 없이 닉네임으로 모집·참여. 이 브라우저의 HTTP-only 쿠키로 내 모임을 기억합니다.
- 모집자 포함 정원 4명, 출발 예정 시각부터 최대 10분 대기.
- 참여자 전용 채팅, 2분/5분 지각 및 도착 메시지, 참여 취소와 모집 취소.
- 예상 총 요금은 작성자가 입력합니다. 실제 탑승 인원과 최종 요금으로 직접 정산합니다.
- 출발 시각은 한국 시간입니다. 모집은 7일 이내로 만들 수 있습니다.
- 학교 공식 서비스나 재학생 인증 서비스가 아닙니다. 택시 호출·결제 기능은 없습니다.

## 실행

Node.js 22.13 이상 및 npm을 준비한 뒤 `npm ci`, `npm run dev`를 실행합니다.
D1 DB 바인딩은 `.openai/hosting.json`에 선언되어 있습니다.
`npm run build` 후 아래 명령으로 로컬 DB에 아직 적용하지 않은 마이그레이션을 순서대로 적용합니다.

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_boring_freak.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_known_the_twelve.sql
```

## 검증

- `node node_modules/typescript/bin/tsc --noEmit`
- `npm run build`
- 로컬 개발 서버 실행 후 `node scripts/verify-app.mjs`: 익명 세션, 출처 검사, 정원 4명, 동시 참여, 채팅 접근 권한, 저장, 참여 취소 및 재참여, 모집 취소를 검증합니다.
- `scripts/verify-ui.mjs`: 작성 환경의 Playwright/Edge로 PC·모바일에서 등록/대화/저장/취소/화면 넘침을 확인합니다. 실행 환경이 바뀌면 스크립트 상단 경로를 수정합니다.
- WebMCP 조회 도구는 지원 브라우저에서만 등록됩니다. 현재 검증 브라우저는 해당 API를 제공하지 않아 네이티브 WebMCP 동작은 미검증입니다.

모집·메시지는 D1에 저장됩니다. 원본 브라우저의 쿠키를 지우거나 다른 브라우저를 사용하면 기존 모임의 관리 권한은 복구할 수 없습니다. 방문자 쿠키는 180일 유지됩니다. 채팅은 화면이 열려 있을 때 4초마다, 모집 목록은 10초마다 갱신됩니다. 채팅에는 최근 100개 메시지가 표시됩니다.
