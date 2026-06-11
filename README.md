# BrainFit Campus

Vercel 배포와 Supabase 연결을 염두에 둔 Vite 웹앱 구조입니다.

## 폴더 구조

- `index.html`: 앱 진입점
- `src/main.js`: 화면 렌더링과 인터랙션 로직
- `src/styles.css`: 전체 스타일
- `src/lib/supabase.js`: Supabase 클라이언트 준비 파일
- `public/assets`: 이미지, 아이콘, 캐릭터 등 정적 에셋 위치

## 에셋 넣는 법

이미지 파일을 `public/assets` 안에 넣으면 코드에서 `/assets/파일명.png`처럼 사용할 수 있습니다.

```html
<img src="/assets/brain-character.png" alt="캐릭터" />
```

## 실행

```bash
npm install
npm run dev
```

로컬 기본 주소는 `http://127.0.0.1:5174/`입니다.

## 배포

GitHub에 올린 뒤 Vercel에서 이 저장소를 Import하면 됩니다.

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Supabase를 붙일 때는 Vercel Project Settings의 Environment Variables에 아래 값을 추가하세요.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

값은 Supabase 프로젝트의 `Project Settings > API`에서 확인합니다. `.env.local`에도 같은 값을 넣으면 로컬에서 실제 회원가입/로그인을 테스트할 수 있습니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## 회원가입/로그인 흐름

- 처음 방문하거나 로그인 세션이 없으면 온보딩이 먼저 뜹니다.
- 온보딩 4번째 화면의 시작 버튼을 누르면 회원가입 화면으로 이동합니다.
- 회원가입은 Supabase Auth email/password를 사용합니다.
- Supabase Auth에서 이메일 인증을 켜두면 가입 후 인증 메일을 확인하고 로그인해야 합니다.
- 이메일 인증을 꺼두면 가입 직후 홈으로 이동하고 DB 동기화가 시작됩니다.
- 새로고침 시 Supabase 세션이 남아 있으면 온보딩을 건너뛰고 저장된 앱 상태를 복구합니다.

## Supabase 데이터 구조

Supabase SQL Editor에서 `supabase/schema.sql`을 실행하면 현재 앱 데이터를 업로드할 수 있는 테이블이 생성됩니다.

- `app_profiles`: 사용자/장치 프로필
- `app_settings`: 코인, 한 줄 코멘트, 온보딩/알림 상태
- `emotion_records`: 감정 기록
- `user_goals`: 오늘 목표/루틴 체크 상태
- `reward_claims`: 연속 기록 보상 수령 상태
- `ai_conversations`, `ai_messages`: AI 공감 대화
- `notification_state`, `notification_events`: 알림 읽음 상태와 알림 row
- `mental_health_centers`, `help_resources`: 도움 화면 데이터
- `brainfit_app_state`: 앱 상태 복구용 스냅샷

현재 앱은 `src/lib/db.js`를 통해 Supabase 로그인 세션이 있을 때 테이블별 업서트를 시도합니다. 로그인 전에는 `localStorage`에만 임시 보관하고, 로그인 후 프로필/기록/보상/목표/AI 대화/알림 상태를 DB에 저장합니다.

실제 Supabase 프로젝트를 만들면 먼저 SQL Editor에서 `supabase/schema.sql` 전체를 실행하세요. 이 schema는 RLS를 켜고 `auth.uid()` 기준으로 자기 데이터만 읽고 쓸 수 있게 설정합니다.
