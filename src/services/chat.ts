import type { DatabaseWrapper, ChatDatabase } from '../db/index';
import { buildSystemPrompt, createAiService } from './ai';
import type { ChatSession, ChatMessage, ChatMemory } from '../models/chat';

export type ChatDb = DatabaseWrapper & ChatDatabase;

export const createChatService = (db: ChatDb) => {
  const ai = createAiService(db);

  const createSession = (userId: string): ChatSession => db.createChatSession(userId);

  const getSession = (userId: string, id: string): ChatSession | null =>
    db.getChatSession(userId, id);

  const listSessions = (userId: string): ChatSession[] => db.listChatSessions(userId);

  const deleteSession = (userId: string, id: string): boolean =>
    db.deleteChatSession(userId, id);

  const sendMessage = async (
    userId: string,
    sessionId: string,
    userContent: string,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> => {
    const session = db.getChatSession(userId, sessionId);
    if (!session) throw new Error('Session not found');

    // Save user message
    const userMessage = db.createChatMessage(userId, sessionId, 'user', userContent);

    // Build history (exclude system messages — those are rebuilt each time)
    const history = db
      .getChatMessages(userId, sessionId)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Build fresh system prompt (includes current weather + memories)
    const systemPrompt = await buildSystemPrompt(db, userId);

    // Call the AI
    const responseContent = await ai.chat(userId, history, systemPrompt);

    // Save assistant response
    const assistantMessage = db.createChatMessage(userId, sessionId, 'assistant', responseContent);

    return { userMessage, assistantMessage };
  };

  const endSession = async (
    userId: string,
    sessionId: string,
  ): Promise<{ summary: string; memories: ChatMemory[] }> => {
    const session = db.getChatSession(userId, sessionId);
    if (!session) throw new Error('Session not found');

    const messages = db
      .getChatMessages(userId, sessionId)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (messages.length === 0) {
      return { summary: '', memories: [] };
    }

    const { summary, memories: memoryTexts } = await ai.summariseSession(messages);

    db.updateChatSession(userId, sessionId, { summary });

    const stored = memoryTexts.map((content) => db.createChatMemory(userId, content));

    return { summary, memories: stored };
  };

  const listMemories = (userId: string): ChatMemory[] => db.listChatMemories(userId);

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
