# Kanban Board - 실시간 협업 칸반보드

Trello 스타일의 실시간 협업 칸반보드 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **DnD**: @dnd-kit (리스트 수평 + 카드 수직/크로스리스트)
- **상태관리**: TanStack Query (서버) + Zustand (클라이언트)
- **모노레포**: pnpm workspace

## 핵심 기능

- Supabase Auth (이메일 + Google OAuth)
- 보드 CRUD + 대시보드
- 리스트/카드 CRUD + float position 기반 순서 관리
- @dnd-kit 드래그앤드롭 (낙관적 업데이트)
- Supabase Realtime 실시간 동기화
- 카드 상세 (설명, 라벨, 담당자, 체크리스트, 댓글, 마감일)
- 팀 초대 + 역할 기반 권한 관리 (owner/admin/member)

## 시작하기

### 사전 준비
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase 프로젝트 (https://supabase.com)

### 1. 설치
```bash
pnpm install
```

### 2. 환경 변수 설정

**클라이언트** (`apps/client/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**서버** (`apps/server/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 3. DB 마이그레이션
Supabase 대시보드의 SQL Editor에서 `supabase/migrations/` 폴더의 SQL 파일을 순서대로 실행합니다.

### 4. 개발 서버 실행
```bash
pnpm dev          # 클라이언트 + 서버 동시 실행
pnpm dev:client   # 클라이언트만
pnpm dev:server   # 서버만
```

- 클라이언트: http://localhost:5173
- 서버: http://localhost:3001

## 프로젝트 구조

```
kanban-board/
├── packages/shared/          # 공유 타입 + Zod 스키마
├── apps/
│   ├── client/               # React + Vite
│   │   └── src/
│   │       ├── pages/        # LoginPage, DashboardPage, BoardPage
│   │       ├── components/   # ui/, board/, list/, card/, invite/
│   │       ├── hooks/        # useAuth, useBoard, useRealtimeBoard, useDragAndDrop
│   │       ├── stores/       # Zustand stores
│   │       ├── services/     # API 호출 함수
│   │       └── lib/          # supabase, axios 설정
│   └── server/               # Express
│       └── src/
│           ├── middleware/    # auth, boardAccess, validate, errorHandler
│           ├── routes/       # board, list, card, member, comment, label, checklist
│           └── services/     # 비즈니스 로직
└── supabase/migrations/      # SQL 마이그레이션
```

## 배포

- **Frontend**: Vercel
- **Backend**: Railway / Render
- **Database**: Supabase (클라우드)
