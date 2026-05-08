import { z } from 'zod';

export const AiBackendSchema = z.enum(['ollama', 'openai']);
export type AiBackend = z.infer<typeof AiBackendSchema>;

export const HemisphereSchema = z.enum(['northern', 'southern']);
export type Hemisphere = z.infer<typeof HemisphereSchema>;

export const SettingsSchema = z
  .object({
    aiBackend: AiBackendSchema,
    ollamaBaseUrl: z.string().min(1).optional(),
    ollamaModel: z.string().min(1).optional(),
    openaiApiKey: z.string().min(1).optional(),
    openaiModel: z.string().min(1).optional(),
    location: z.string().optional(),
    hemisphere: HemisphereSchema,
    weatherApiKey: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.aiBackend === 'openai' && !value.openaiApiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['openaiApiKey'],
        message: 'openaiApiKey is required when aiBackend is "openai"',
      });
    }
  });

export type Settings = z.infer<typeof SettingsSchema>;

export const UpdateSettingsInputSchema = SettingsSchema;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;
