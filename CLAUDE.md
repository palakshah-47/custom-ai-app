# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Start Vite dev server (localhost)
npm run build       # Production build
npm run preview     # Serve the built dist/
npm run lint        # ESLint on src/
npm run typecheck   # tsc --noEmit (type-check without emitting)
npm run test        # Vitest in watch mode
npm run test:run    # Vitest single run
```

## Environment Setup

Copy `.env.example` to `.env` and set:

- `OLLAMA_HOST` — Ollama server URL (default: `http://127.0.0.1:11434`)
- `VITE_OLLAMA_MODEL` — Ollama model name (default: `tinyllama`)
- `ANTHROPIC_API_KEY` — Optional; enables the Anthropic proxy

Vite proxies `/api/ollama` → Ollama and `/api/anthropic` → `api.anthropic.com` (see `vite.config.js`).

## Architecture

**AgentAI** (`domus-ai-app`) is a React 19 + TypeScript SPA — an AI agent builder and chat interface. There is no backend; all logic runs in the browser, communicating with Ollama (or optionally Anthropic) via Vite's dev proxy.

### Layout & State

`App.tsx` is the root. It reads `showBanner` and `panelView` from `useChatStore` and assembles the three-column layout:

| Column | Component                                    | Width  |
| ------ | -------------------------------------------- | ------ |
| Left   | `ChatSidebar`                                | 268 px |
| Center | `ChatColumn`                                 | flex   |
| Right  | `RightPanel` (Agent Builder / Settings tabs) | 340 px |

State is managed by two Zustand v5 stores (both persisted to `localStorage`):

| Store | File | Persists |
| ----- | ---- | -------- |
| `useChatStore` | `src/store/chatStore.ts` | `sessions`, `activeSessionId`, `bookmarksOnly` |
| `useAgentStore` | `src/store/agentStore.ts` | `agents`, `activeAgentId` |

There is no prop drilling for global state — components read from stores directly via selectors.

### Chat Flow

1. User submits a message via `ChatColumn`; `useSendMessage` handles it.
2. If the session has ≥ 20 messages, the oldest 14 are summarized via `summarizeMessages()` and replaced with a single summary message (`isSummary: true`).
3. Agent instructions have `{{variable}}` placeholders interpolated before the request.
4. `getAIProvider()` returns an `OllamaProvider` instance, which POSTs to `/api/ollama/api/chat` and parses the NDJSON streaming response, appending tokens to the assistant message in real time via a Zustand updater function.
5. An `AbortController` signal is threaded through; the Stop button cancels the in-flight request.

### AI Provider Abstraction

`src/lib/ai/index.ts` exports a `getAIProvider()` factory that returns the active `AIProvider` implementation. Currently only `OllamaProvider` is implemented. Swapping backends (Anthropic, etc.) means implementing the `AIProvider` interface in `src/lib/ai/types.ts` and updating the factory.

### Styling

All component styles use **CSS Modules** (`*.module.css` co-located with each component). Global design tokens are CSS custom properties defined in `src/styles/global.css`. Markdown content in chat uses `src/styles/markdown.css` scoped under the `.chat-md` class.

Color palette: teal (`--color-teal: #1a3a3a`), orange (`--color-accent: #e8472a`), light teal (`--color-light-teal`), off-white (`--color-bg`).

### Key Files

```
src/
├── App.tsx                        Root layout; reads showBanner + panelView from chatStore
├── main.tsx                       Bootstrap; imports global.css + markdown.css
├── store/
│   ├── chatStore.ts               Session CRUD, archive, bookmark, share, message streaming state
│   └── agentStore.ts              Agent config CRUD; custom merge for backwards-compat
├── hooks/
│   └── useSendMessage.ts          Send logic: summarization, variable interpolation, AI call, abort
├── lib/ai/
│   ├── index.ts                   getAIProvider() factory
│   ├── types.ts                   AIProvider interface + SendOptions type
│   ├── ollamaProvider.ts          Ollama NDJSON streaming implementation
│   └── summarize.ts               Context compression utility (non-streaming single request)
├── types/index.ts                 Message, Session, AgentConfig, AgentCategory types
├── constants/appConstants.ts      SUGGESTIONS chips, MENU_ITEMS
├── styles/
│   ├── global.css                 CSS custom properties, resets
│   └── markdown.css               .chat-md scoped markdown styles
└── test/
    ├── chatStore.test.ts          6 tests: session CRUD, bookmarks, rename
    ├── agentStore.test.ts         6 tests: agent CRUD, defaults, merge
    └── ollamaProvider.test.ts     4 tests: streaming, fallback, error handling
```

### TypeScript Configuration

Strict mode is on with `noUncheckedIndexedAccess`. Module resolution is `"Bundler"` (Vite). Path alias `@/*` maps to `src/*`. Target is ES2022. JSX uses React 19's automatic transform (`"react-jsx"`).
