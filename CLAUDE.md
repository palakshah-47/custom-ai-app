# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Root (monorepo):**

```bash
npm install         # Install both frontend and backend workspaces
npm run dev         # Start both Vite dev server (5173) + Express backend (3000)
npm run build       # Build both frontend & backend for production
npm run test        # Run tests for both workspaces
```

**Frontend only:**

```bash
cd frontend
npm run dev         # Vite dev server (localhost:5173)
npm run build       # Production build to dist/
npm run lint        # ESLint on src/
npm run typecheck   # tsc --noEmit (type-check without emitting)
npm run test        # Vitest in watch mode
```

**Backend only:**

```bash
cd backend
npm run dev         # Express server (localhost:3000)
npm run build       # Compile TypeScript to dist/
npm run start       # Run built backend
npm run migrate     # Run Prisma migrations (production)
npm run prisma:studio # Open Prisma Studio (dev only)
npm run test        # Vitest in watch mode
```

## Environment Setup

### Frontend (.env.local)

Copy `frontend/.env.example` to `frontend/.env.local` and set:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx    # From Clerk dashboard
VITE_BACKEND_URL=http://localhost:3000      # Backend API address (dev)
```

### Backend (.env)

Copy `backend/.env.example` to `backend/.env` and set:

```
CLERK_SECRET_KEY=sk_test_xxxxx              # From Clerk dashboard
DATABASE_URL=postgresql://user:password@localhost:5432/custom_ai_app_dev
NODE_ENV=development
FRONTEND_URL=http://localhost:5173          # Frontend address for CORS
OPENAI_API_KEY=sk-xxxxx                     # Backend-managed key (optional: users can provide their own)
```

## Architecture

**AgentAI** is a **monorepo** containing:

- **Frontend**: React 19 + TypeScript SPA (Vite)
- **Backend**: Express.js + TypeScript with Prisma ORM
- **Database**: PostgreSQL (Neon in production)
- **Auth**: Clerk (handles sign-up, sign-in, session management)
- **AI**: OpenAI API (backend-side only, never exposed to browser)

Frontend is a client-side-rendered (CSR) app that calls backend API endpoints. All sensitive logic (OpenAI API calls, database access, secret key management) runs server-side. Clerk provides authentication; frontend gets JWT token automatically and passes it to every backend request.

### Layout & State

`App.tsx` is the root. It reads `showBanner` and `panelView` from `useChatStore` and assembles the three-column layout:

| Column | Component                                    | Width  |
| ------ | -------------------------------------------- | ------ |
| Left   | `ChatSidebar`                                | 268 px |
| Center | `ChatColumn`                                 | flex   |
| Right  | `RightPanel` (Agent Builder / Settings tabs) | 340 px |

State is managed by two Zustand v5 stores (client-side caches only, **not persisted to localStorage**):

| Store           | File                               | Source                                       |
| --------------- | ---------------------------------- | -------------------------------------------- |
| `useChatStore`  | `frontend/src/store/chatStore.ts`  | Backend API (`/sessions`, `/messages`)       |
| `useAgentStore` | `frontend/src/store/agentStore.ts` | Backend API (`/agents`) + Clerk user context |

Components read from stores directly via selectors. On mount, frontend fetches all user data from backend and populates stores. On logout (Clerk), stores are cleared.

### Chat Flow

1. **User signs in via Clerk** → Frontend gets JWT token (auto-injected into all API requests by `ClerkProvider`)
2. **User submits message** via `ChatColumn` → `useSendMessage` hook calls backend `POST /api/chat`
3. **Backend (Express route `/api/chat`):**
    - Verifies Clerk JWT token via `@clerk/backend` middleware
    - Retrieves session & agent config from PostgreSQL (Prisma)
    - Fetches user's OpenAI API key from `UserSecret` table (encrypted)
    - Checks if session has ≥ 20 messages; if so, summarizes oldest 14 into 1 via OpenAI
    - Calls OpenAI API with system prompt + message history
    - Streams response back as Server-Sent Events (SSE)
4. **Frontend receives SSE stream** → Parses tokens → Updates assistant message in real-time via Zustand updater
5. **Backend persists to PostgreSQL**:
    - Saves user message
    - Saves assistant response
    - Marks context-compressed messages as `isSummary: true`
6. **Stop button** → Aborts frontend fetch → Backend streaming stops

### API Communication

**Frontend → Backend:**

- `frontend/src/lib/api/client.ts` — Fetch wrapper that auto-injects Clerk JWT
- Uses fetch with `Authorization: Bearer <jwt>` header on every request
- Handles 401 (token expired) by triggering Clerk re-auth

**Backend → OpenAI:**

- `backend/src/services/openaiService.ts` — Calls OpenAI API with backend-managed key
- Streams response as NDJSON (one JSON object per line)
- Frontend parses SSE format: `data: {"choices":[...]}"

### Styling

All component styles use **CSS Modules** (`*.module.css` co-located with each component). Global design tokens are CSS custom properties defined in `src/styles/global.css`. Markdown content in chat uses `src/styles/markdown.css` scoped under the `.chat-md` class.

Color palette: teal (`--color-teal: #1a3a3a`), orange (`--color-accent: #e8472a`), light teal (`--color-light-teal`), off-white (`--color-bg`).

### Key Files

**Frontend:**

```
frontend/src/
├── App.tsx                        Root layout; auth guard + three-column layout
├── main.tsx                       ClerkProvider wrapper + global CSS imports
├── components/
│   ├── SignInWithClerk.tsx        Clerk's <SignIn /> component (full-page)
│   ├── ChatColumn.tsx             Chat UI + input form
│   ├── ChatSidebar.tsx            Session list + bookmark filter
│   ├── RightPanel.tsx             Agent builder / Settings tabs
│   ├── Navbar.tsx                 App header + <UserButton /> (Clerk)
│   └── ...
├── store/
│   ├── chatStore.ts               Zustand store; client-side cache for sessions/messages
│   └── agentStore.ts              Zustand store; client-side cache for agents
├── hooks/
│   └── useSendMessage.ts          Calls backend POST /api/chat, handles SSE streaming
├── lib/api/
│   ├── client.ts                  Fetch wrapper w/ Clerk JWT injection
│   ├── sessions.ts                GET/POST /sessions, etc.
│   ├── messages.ts                GET/POST /sessions/:id/messages, etc.
│   └── agents.ts                  GET/POST /agents, etc.
├── types/index.ts                 Message, Session, AgentConfig, AgentCategory
├── styles/
│   ├── global.css                 CSS custom properties, resets
│   └── markdown.css               .chat-md scoped markdown styles
└── test/
    ├── chatStore.test.ts          Store CRUD tests
    └── agentStore.test.ts         Agent CRUD tests
```

**Backend:**

```
backend/src/
├── main.ts                        Express app: CORS + middleware + route mounting
├── lib/
│   └── prisma.ts                  PrismaClient singleton
├── prisma/
│   ├── schema.prisma              Prisma models: User, UserSecret, Session, Message, Agent
│   └── migrations/                Auto-generated by prisma migrate
├── routes/
│   ├── sessions.ts                GET, POST, PUT, DELETE /sessions
│   ├── messages.ts                GET /sessions/:id/messages, POST (create + AI response)
│   ├── agents.ts                  GET, POST, PUT, DELETE /agents
│   └── openai.ts                  POST /api/chat (OpenAI proxy + streaming)
├── middleware/
│   ├── clerk.ts                   JWT verification via @clerk/backend
│   └── errorHandler.ts            Catch-all error handler
├── services/
│   ├── sessionService.ts          Prisma queries for sessions (CRUD + archive/bookmark)
│   ├── messageService.ts          Prisma queries for messages (CRUD + summarization)
│   ├── agentService.ts            Prisma queries for agents (CRUD)
│   └── openaiService.ts           OpenAI API wrapper + SSE streaming
├── types/
│   └── index.ts                   Request types, response types
├── utils/
│   └── validation.ts              Input validation (email, message length, etc.)
└── test/
    ├── sessions.test.ts           Prisma + Clerk mock tests
    ├── openai.test.ts             OpenAI streaming + error handling
    └── setup.ts                   Vitest setup (test DB config)
```

### TypeScript Configuration

**Frontend:** Strict mode on with `noUncheckedIndexedAccess`. Module resolution `"Bundler"` (Vite). Path alias `@/*` → `src/*`. Target ES2022. JSX: `react-jsx` (React 19 automatic transform).

**Backend:** Strict mode on. Module resolution `"node"`. Path alias `@/*` → `src/*`. Target ES2022. Compiled to `dist/` folder for production.

### Deployment

**Frontend → Vercel:**

- Automatically deploys on push to `main`
- Environment: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_BACKEND_URL`
- Production: `your-app.vercel.app`

**Backend → Railway:**

- Automatically deploys on push to `main`
- Environment: `CLERK_SECRET_KEY`, `DATABASE_URL`, `NODE_ENV`
- Runs `npm run build` then `npm run start` on port 3000
- Runs `npx prisma migrate deploy` during deploy

**Database → Neon PostgreSQL:**

- Managed PostgreSQL service
- Auto-backups included
- Connection string in `DATABASE_URL`

**Authentication → Clerk:**

- Production keys in Clerk dashboard (pk*live*_, sk*live*_)
- Configured domain: `your-app.com`

