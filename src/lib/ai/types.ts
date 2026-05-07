import type { Message } from '../../types';

export type SetMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => void;

export interface SendOptions {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIProvider {
  sendMessage(
    systemPrompt: string,
    history: Message[],
    userText: string,
    setMessages: SetMessages,
    options?: SendOptions
  ): Promise<void>;
}
