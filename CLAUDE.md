# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost)
npm run build     # Production build
npm run preview   # Serve the built dist/
```

No lint or test commands are configured.

## Environment Setup

Copy `.env.example` to `.env` and set:

- `OLLAMA_HOST` — Ollama server URL (default: `http://127.0.0.1:11434`)
- `VITE_OLLAMA_MODEL` — Ollama model name (default: `tinyllama`)
- `ANTHROPIC_API_KEY` — Optional; enables the Anthropic proxy

Vite proxies `/api/ollama` → Ollama and `/api/anthropic` → `api.anthropic.com` (see `vite.config.js`).

## Architecture

**AgentAI** is a React 19 SPA — an AI agent builder and chat interface. There is no backend; all logic runs in the browser, communicating with Ollama (or optionally Anthropic) via Vite's dev proxy.

### Layout & State

`App.jsx` is the root. It owns all agent-configuration state (name, instructions, settings) and orchestrates the three-column layout:

| Column | Component                                    | Width  |
| ------ | -------------------------------------------- | ------ |
| Left   | `ChatSidebar`                                | 268 px |
| Center | `ChatColumn`                                 | flex   |
| Right  | `RightPanel` (Agent Builder / Settings tabs) | 340 px |

Chat session state lives entirely in the `useChatSessions` hook (`src/hooks/useChatSessions.js`), which is instantiated once in `App.jsx` and passed down as props. There is no global state library — everything flows through prop drilling.

### Chat Flow

1. User submits a message via `ChatColumn`.
2. `useChatSessions` calls `streamOllamaChat` from `src/hooks/ollamaChat.js`.
3. `ollamaChat.js` posts to `/api/ollama/api/chat` and parses the NDJSON streaming response, appending tokens to the assistant message in real time.
4. The session's `messages` array is updated reactively; no persistence exists across page reloads.

### Styling

All styles are plain JS objects defined in `src/styles/appStyles.js`. There is no CSS file, no CSS framework, and no CSS-in-JS library. The palette centers on teal (`#1a3a3a`), orange (`#e8472a`), light teal (`#e8f5f0`), and off-white (`#f5f4f1`).

### Key files

- `src/App.jsx` — root component; agent config state; layout assembly
- `src/hooks/useChatSessions.js` — all session CRUD, archive, bookmark, share
- `src/hooks/ollamaChat.js` — streaming Ollama API client
- `src/styles/appStyles.js` — all inline style definitions
- `vite.config.js` — proxy rules and env-var loading

