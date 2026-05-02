import { z } from 'zod';

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  model: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  summary: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ChatMemorySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SendMessageInputSchema = z.object({
  content: z.string().min(1),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type ChatMemory = z.infer<typeof ChatMemorySchema>;
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
