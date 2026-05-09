import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod';
import { router } from './orpc/router';

export {
  PlantSchema,
  CreatePlantInputSchema,
  UpdatePlantInputSchema,
} from '@sprout/shared/schemas/plant';
export {
  CalendarEventSchema,
  CreateCalendarEventInputSchema,
  UpdateCalendarEventInputSchema,
} from '@sprout/shared/schemas/calendar';

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

export function generateOpenApiSpec() {
  return generator.generate(router, {
    info: {
      title: 'Garden Agent API',
      description: 'API for managing garden plants and scheduling',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
  });
}
