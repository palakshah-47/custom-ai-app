import type { Message } from '../../types';

export type SetMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => void;
