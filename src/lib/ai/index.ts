import { OllamaProvider } from './ollamaProvider';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  return new OllamaProvider();
}

export type { AIProvider, SetMessages } from './types';
