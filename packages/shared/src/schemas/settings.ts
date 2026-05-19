import { z } from 'zod';

export const AiBackendSchema = z.enum(['local', 'openai']);
export type AiBackend = z.infer<typeof AiBackendSchema>;

export const HemisphereSchema = z.enum(['northern', 'southern']);
export type Hemisphere = z.infer<typeof HemisphereSchema>;

export const LogLevelSchema = z.enum([
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogFormatSchema = z.enum(['pretty', 'json']);
export type LogFormat = z.infer<typeof LogFormatSchema>;

export const SettingsSchema = z
  .object({
    aiBackend: AiBackendSchema,
    localAiBaseUrl: z.string().min(1).optional(),
    localAiModel: z.string().min(1).optional(),
    openaiApiKey: z.string().min(1).optional(),
    openaiModel: z.string().min(1).optional(),
    location: z.string().optional(),
    hemisphere: HemisphereSchema,
    weatherApiKey: z.string().optional(),
    appBaseUrl: z.string().min(1).optional(),
    aiPreamble: z.string().min(1).optional(),
    logLevel: LogLevelSchema.optional(),
    logFormat: LogFormatSchema.optional(),
    logSilent: z.boolean().optional(),
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
