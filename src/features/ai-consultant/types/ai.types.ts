/**
 * =============================================================================
 * AI Consultant Type Definitions
 * =============================================================================
 */

export interface ActionableSuggestion {
  label: string;
  description: string;
  action: () => void;
  icon?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageBase64?: string;
  actions?: ActionableSuggestion[];
  isOfflineGenerated?: boolean;
}
