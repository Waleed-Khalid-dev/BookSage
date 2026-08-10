import { create } from 'zustand';
import { invokePython } from '../services/pythonService';
import {
  saveChatSession,
  getAllChatSessions,
  deleteChatSession,
  pinChapterInsight,
  ChatMessageRecord,
  ChatSessionRecord,
} from '../services/dbService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContextMode = 'chapter' | 'book' | 'custom';
export type QuickActionType = 
  | 'summarize' | 'eli5' | 'explain' | 'shorten' | 'lengthen' | 'grammar' | 'rephrase'
  | 'define' | 'encyclopedia'
  | 'professional' | 'casual' | 'concise' | 'academic'
  | 'takeaways' | 'flashcard';
export type CopilotPersona = 'scholar' | 'teacher' | 'coach' | 'devil';

export interface ChatMessage extends ChatMessageRecord {
  followUps?: string[];   // Suggested follow-up questions parsed from response
}

export interface ChatSession {
  id: string;
  bookId: string | null;
  title: string;
  messages: ChatMessage[];
  contextMode: ContextMode;
  modelName: string;
  createdAt: number;
  updatedAt: number;
}

export interface SelectionAnchor {
  text: string;
  rect: DOMRect;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface ChatState {
  // Session management
  sessions: ChatSession[];
  activeSessionId: string | null;

  // UI state
  isLoading: boolean;
  isSidebarOpen: boolean;
  showPopup: boolean;
  showContextMenu: boolean;
  contextMenuPos: { x: number; y: number };
  popupSize: { w: number; h: number };
  popupFontSize: number;
  pendingQuickAction: { type: 'action', action: QuickActionType } | { type: 'translate', lang: string } | null;

  // Selection state (shared between BookReader & NotesViewer)
  selection: SelectionAnchor | null;

  // Persona
  persona: CopilotPersona;

  // Derived helpers
  activeSession: () => ChatSession | null;

  // Actions — sessions
  loadSessions: (bookId: string) => Promise<void>;
  createSession: (bookId: string, modelName: string) => ChatSession;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;

  // Actions — messaging
  sendMessage: (
    text: string,
    contextText: string,
    provider: string,
    apiKey: string,
    modelName: string
  ) => Promise<void>;
  sendQuickAction: (
    action: QuickActionType,
    selectedText: string,
    provider: string,
    apiKey: string,
    modelName: string
  ) => Promise<string>;
  sendTranslate: (
    text: string,
    targetLanguage: string,
    provider: string,
    apiKey: string,
    modelName: string
  ) => Promise<string>;
  pinInsight: (chapterId: string, content: string) => Promise<void>;

  // Actions — UI
  toggleSidebar: () => void;
  openSidebar: () => void;
  setShowPopup: (show: boolean) => void;
  setSelection: (anchor: SelectionAnchor | null) => void;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
  setPersona: (p: CopilotPersona) => void;
  setPopupSize: (w: number, h: number) => void;
  setPopupFontSize: (size: number) => void;
  setPendingQuickAction: (action: { type: 'action', action: QuickActionType } | { type: 'translate', lang: string } | null) => void;
}

// ─── Persona prompts ──────────────────────────────────────────────────────────

const PERSONA_PROMPTS: Record<CopilotPersona, string> = {
  scholar:  'Respond as a detailed academic expert. Cite principles, use precise language.',
  teacher:  'Explain simply. Use analogies and everyday examples to make concepts clear.',
  coach:    'Be direct, motivational, and action-focused. What should the reader DO next?',
  devil:    'Challenge assumptions. Play devil\'s advocate. What could go wrong with this idea?',
};

// ─── Quick-action prompt templates ───────────────────────────────────────────

const QUICK_ACTION_PROMPTS: Record<QuickActionType, string> = {
  summarize: 'Summarize the following text concisely in 2-3 sentences:\n\n',
  eli5:      'Explain the following text as if I am 5 years old, using very simple language:\n\n',
  explain:   'Provide a detailed explanation of the following text, including context and implications:\n\n',
  shorten:   'Rewrite the following text in a shorter, more concise form, preserving the core meaning:\n\n',
  lengthen:  'Expand and elaborate on the following text with more detail, examples, and context:\n\n',
  grammar:   'Fix all grammar, spelling, and punctuation issues in the following text. Return only the corrected text:\n\n',
  rephrase:  'Rephrase the following text in a different style while preserving the meaning:\n\n',
  define:       'Provide a concise dictionary definition for the following term, including its part of speech:\n\n',
  encyclopedia: 'Provide a brief, Wikipedia-style encyclopedia summary for the following person, place, or concept:\n\n',
  professional: 'Rewrite the following text in a highly professional, formal business tone:\n\n',
  casual:       'Rewrite the following text in a friendly, casual, and approachable tone:\n\n',
  concise:      'Rewrite the following text to be as concise and punchy as possible, removing all fluff:\n\n',
  academic:     'Rewrite the following text in an academic, scholarly tone, using precise terminology:\n\n',
  takeaways:    'Extract the key takeaways from the following text and format them as a bulleted list:\n\n',
  flashcard:    'Create a study flashcard (Question and Answer) based on the most important concept in the following text:\n\n',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(role: 'user' | 'assistant', content: string, followUps?: string[]): ChatMessage {
  return { id: crypto.randomUUID(), role, content, ts: Date.now(), followUps };
}

/** Extract @@FOLLOWUP: lines from AI response and strip them from visible content. */
function parseFollowUps(raw: string): { content: string; followUps: string[] } {
  const lines = raw.split('\n');
  const followUps: string[] = [];
  const rest: string[] = [];
  for (const line of lines) {
    if (line.startsWith('@@FOLLOWUP:')) {
      followUps.push(line.replace('@@FOLLOWUP:', '').trim());
    } else {
      rest.push(line);
    }
  }
  return { content: rest.join('\n').trim(), followUps };
}

function sessionToRecord(s: ChatSession): ChatSessionRecord {
  return {
    id: s.id,
    book_id: s.bookId,
    title: s.title,
    messages: JSON.stringify(s.messages),
    context_mode: s.contextMode,
    model_name: s.modelName,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function recordToSession(r: ChatSessionRecord): ChatSession {
  return {
    id: r.id,
    bookId: r.book_id,
    title: r.title,
    messages: r.messages ? JSON.parse(r.messages) : [],
    contextMode: r.context_mode,
    modelName: r.model_name ?? 'gemini-3.6-flash',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  isSidebarOpen: false,
  showPopup: false,
  showContextMenu: false,
  contextMenuPos: { x: 0, y: 0 },
  selection: null,
  persona: 'scholar',
  popupSize: { w: 400, h: 300 },
  popupFontSize: 0, // 0 means dynamic based on width
  pendingQuickAction: null,

  activeSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find(s => s.id === activeSessionId) ?? null;
  },

  // ── Session management ──────────────────────────────────────────────────────

  loadSessions: async (bookId: string) => {
    try {
      const records = await getAllChatSessions(bookId);
      const sessions = records.map(recordToSession);
      set({ sessions });
      if (sessions.length > 0 && !get().activeSessionId) {
        set({ activeSessionId: sessions[0].id });
      }
    } catch (e) {
      console.error('[chatStore] loadSessions error', e);
    }
  },

  createSession: (bookId: string, modelName: string) => {
    const now = Date.now();
    const session: ChatSession = {
      id: crypto.randomUUID(),
      bookId,
      title: 'New Chat',
      messages: [],
      contextMode: 'chapter',
      modelName,
      createdAt: now,
      updatedAt: now,
    };
    set(state => ({ sessions: [session, ...state.sessions], activeSessionId: session.id }));
    saveChatSession(sessionToRecord(session)).catch(console.error);
    return session;
  },

  setActiveSession: (id: string) => set({ activeSessionId: id }),

  deleteSession: async (id: string) => {
    await deleteChatSession(id);
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id);
      const activeSessionId =
        state.activeSessionId === id
          ? sessions[0]?.id ?? null
          : state.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  // ── Messaging ───────────────────────────────────────────────────────────────

  sendMessage: async (text, contextText, provider, apiKey, modelName) => {
    const { activeSession, persona } = get();
    let session = activeSession();
    if (!session) return;

    const userMsg = makeMessage('user', text);
    const updatedMessages = [...session.messages, userMsg];

    // Optimistically add user message
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === session!.id ? { ...s, messages: updatedMessages } : s
      ),
      isLoading: true,
    }));

    // Build history for Python (exclude follow-up metadata)
    const history = updatedMessages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const personaPrefix = `${PERSONA_PROMPTS[persona]}\n\n`;

    try {
      const res = await invokePython({
        command: 'chat_message',
        message: text,
        history,
        context_text: personaPrefix + contextText,
        provider,
        api_key: apiKey,
        model_name: modelName,
      });

      const rawResponse = res.status === 'success'
        ? res.response ?? '(No response)'
        : `Error: ${res.message}`;

      const { content, followUps } = parseFollowUps(rawResponse);
      const aiMsg = makeMessage('assistant', content, followUps);
      const finalMessages = [...updatedMessages, aiMsg];

      // Auto-title from first user message
      const title = session.messages.length === 0
        ? text.split(' ').slice(0, 6).join(' ')
        : session.title;

      const updated: ChatSession = {
        ...session,
        messages: finalMessages,
        title,
        updatedAt: Date.now(),
        modelName,
      };

      set(state => ({
        sessions: state.sessions.map(s => s.id === session!.id ? updated : s),
        isLoading: false,
      }));

      saveChatSession(sessionToRecord(updated)).catch(console.error);
    } catch (e: any) {
      const errMsg = makeMessage('assistant', `Error: ${e.message ?? String(e)}`);
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === session!.id
            ? { ...s, messages: [...updatedMessages, errMsg] }
            : s
        ),
        isLoading: false,
      }));
    }
  },

  sendQuickAction: async (action, selectedText, provider, apiKey, modelName) => {
    const prompt = QUICK_ACTION_PROMPTS[action] + selectedText;
    const res = await invokePython({
      command: 'chat_message',
      message: prompt,
      history: [],
      context_text: '',
      provider,
      api_key: apiKey,
      model_name: modelName,
    });
    if (res.status === 'success') return res.response ?? '';
    throw new Error(res.message ?? 'Quick action failed');
  },

  sendTranslate: async (text, targetLanguage, provider, apiKey, modelName) => {
    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text:\n\n${text}`;
    const res = await invokePython({
      command: 'chat_message',
      message: prompt,
      history: [],
      context_text: '',
      provider,
      api_key: apiKey,
      model_name: modelName,
    });
    if (res.status === 'success') return res.response ?? '';
    throw new Error(res.message ?? 'Translation failed');
  },

  pinInsight: async (chapterId, content) => {
    await pinChapterInsight(chapterId, content);
  },

  // ── UI ──────────────────────────────────────────────────────────────────────

  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  setShowPopup: (show) => set({ showPopup: show }),
  setSelection: (anchor) => set((state) => {
    // If popup is open, don't clear the context if native selection vanishes (e.g. clicking an input)
    if (state.showPopup && !anchor) {
      return {};
    }
    if (state.selection?.text === anchor?.text) {
      return { selection: anchor };
    }
    // Update selection but preserve showPopup so the popup doesn't close abruptly
    return { selection: anchor, showPopup: state.showPopup };
  }),
  openContextMenu: (x, y) => set({ showContextMenu: true, contextMenuPos: { x, y } }),
  closeContextMenu: () => set({ showContextMenu: false }),
  setPersona: (p) => set({ persona: p }),
  setPopupSize: (w, h) => set({ popupSize: { w, h } }),
  setPopupFontSize: (size) => set({ popupFontSize: size }),
  setPendingQuickAction: (action) => set({ pendingQuickAction: action }),
}));
