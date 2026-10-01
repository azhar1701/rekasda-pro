/**
 * =============================================================================
 * useAIChatHistory — Shared Chat History & Persistence Hook
 * =============================================================================
 * Menyinkronkan riwayat percakapan antara Halaman Penuh (/ai)
 * dan Floating Drawer (AIConsultantDrawer) via localStorage & custom events.
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/ai.types';

const STORAGE_KEY = 'rekasda_ai_history';
const SYNC_EVENT = 'rekasda_ai_history_sync';

export function useAIChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load from localStorage
  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load AI chat history:', e);
    }
  }, []);

  useEffect(() => {
    loadHistory();

    const handleSync = () => loadHistory();
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadHistory]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(SYNC_EVENT));
      } catch (e) {
        console.error('Failed to save message:', e);
      }
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  const exportChatToMarkdown = useCallback(() => {
    if (messages.length === 0) return;

    const lines: string[] = [
      '# NOTULEN KONSULTASI AHLI HIDROLOGI (REKASDA PRO)',
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      'Standar Acuan: SNI 2415:2016, SNI 19-6728.1-2002, Pd T-03-2005-A',
      '---',
      ''
    ];

    messages.forEach((m) => {
      const sender = m.role === 'user' ? 'Pengguna / Engineer' : 'Ahli Madya SDA (AI)';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(`### [${time}] ${sender}`);
      lines.push(m.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Notulen_Konsultasi_AI_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    addMessage,
    clearMessages,
    exportChatToMarkdown,
    setMessages
  };
}
