import type { Plant, CreatePlantInput, UpdatePlantInput } from '@sprout/shared/schemas/plant';
import { CreatePlantInputSchema, UpdatePlantInputSchema } from '@sprout/shared/schemas/plant';
import type { DatabaseWrapper } from '../db/index';

export const createPlantService = (db: DatabaseWrapper) => ({
  listPlants(): Plant[] {
    return db.getAllPlants();
  },

  getPlant(id: string): Plant | null {
    return db.getPlantById(id);
  },

  createPlant(input: CreatePlantInput): Plant {
    const validInput = CreatePlantInputSchema.parse(input);
    return db.createPlant(validInput);
  },

  updatePlant(id: string, input: UpdatePlantInput): Plant | null {
    const validInput = UpdatePlantInputSchema.parse(input);
    return db.updatePlant(id, validInput);
  },

  deletePlant(id: string): boolean {
    return db.deletePlant(id);
  },
});

export default createPlantService;
