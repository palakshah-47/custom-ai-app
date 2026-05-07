export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  tokens?: number;
  isSummary?: boolean;
}

export interface Session {
  id: string;
  title: string;
  titleEdited: boolean;
  messages: Message[];
  archived: boolean;
  bookmarked: boolean;
  createdAt: number;
}

export type AgentCategory =
  | 'Others'
  | 'Finance'
  | 'Legal'
  | 'HR'
  | 'Sales'
  | 'Marketing';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  instructions: string;
  enableArtifacts: boolean;
  enableHighQuality: boolean;
  advancedControl: boolean;
  enableFileSearch: boolean;
  supportName: string;
  supportEmail: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  variables: Record<string, string>;
}
