// Ollama provider removed — AI calls are now handled server-side via OpenAI.
// This file is kept as a placeholder so no test runners break.
import { describe, it } from 'vitest';

describe('AI provider', () => {
  it('is handled server-side via /api/chat', () => {
    // No client-side provider to test; see server/routes/chat.ts
  });
});
