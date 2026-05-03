import type { DatabaseWrapper, ChatDatabase } from '../db/index';
import { buildSystemPrompt, createAiService } from './ai';
import type { ChatSession, ChatMessage, ChatMemory } from '../models/chat';

export type ChatDb = DatabaseWrapper & ChatDatabase;

export const createChatService = (db: ChatDb) => {
  const ai = createAiService(db);

  const createSession = (): ChatSession => db.createChatSession();

  const getSession = (id: string): ChatSession | null => db.getChatSession(id);

  const listSessions = (): ChatSession[] => db.listChatSessions();

  const deleteSession = (id: string): boolean => db.deleteChatSession(id);

  const sendMessage = async (
    sessionId: string,
    userContent: string,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> => {
    const session = db.getChatSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Save user message
    const userMessage = db.createChatMessage(sessionId, 'user', userContent);

    // Build history (exclude system messages — those are rebuilt each time)
    const history = db
      .getChatMessages(sessionId)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Build fresh system prompt (includes current weather + memories)
    const systemPrompt = await buildSystemPrompt(db);

    // Call the AI
    const responseContent = await ai.chat(history, systemPrompt);

    // Save assistant response
    const assistantMessage = db.createChatMessage(sessionId, 'assistant', responseContent);

    return { userMessage, assistantMessage };
  };

  const endSession = async (
    sessionId: string,
  ): Promise<{ summary: string; memories: ChatMemory[] }> => {
    const session = db.getChatSession(sessionId);
    if (!session) throw new Error('Session not found');

    const messages = db
      .getChatMessages(sessionId)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (messages.length === 0) {
      return { summary: '', memories: [] };
    }

    const { summary, memories: memoryTexts } = await ai.summariseSession(messages);

    db.updateChatSession(sessionId, { summary });

    const stored = memoryTexts.map((content) => db.createChatMemory(content));

    return { summary, memories: stored };
  };

  const listMemories = (): ChatMemory[] => db.listChatMemories();

  return {
    createSession,
    getSession,
    listSessions,
    deleteSession,
    sendMessage,
    endSession,
    listMemories,
  };
};
