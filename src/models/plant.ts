import { z } from 'zod';

export const PlantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  species: z.string().min(1).max(255),
  location: z.string().max(255).optional(),
  plantedDate: z.string().datetime().optional(),
  lastWatered: z.string().datetime().optional(),
  wateringFrequency: z.number().int().min(1).optional(),
  lastFertilized: z.string().datetime().optional(),
  fertilizingFrequency: z.number().int().min(1).optional(),
  notes: z.string().max(50000).optional(),
  sunlightRequirement: z.enum(['full-sun', 'partial-shade', 'shade']).optional(),
  soilType: z.string().max(100).optional(),
  harvestDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Plant = z.infer<typeof PlantSchema>;

export const CreatePlantInputSchema = PlantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  plantedDate: true,
  lastWatered: true,
  lastFertilized: true,
  harvestDate: true,
}).strict();

export type CreatePlantInput = z.infer<typeof CreatePlantInputSchema>;

export const UpdatePlantInputSchema = CreatePlantInputSchema.partial();

export type UpdatePlantInput = z.infer<typeof UpdatePlantInputSchema>;
