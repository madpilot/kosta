import type { DatabaseWrapper } from '../db/index';
import type { Plant, CreatePlantInput, UpdatePlantInput } from '../models/plant';
import { CreatePlantInputSchema, UpdatePlantInputSchema } from '../models/plant';

export const createPlantService = (db: DatabaseWrapper) => ({
  listPlants(userId: string): Plant[] {
    return db.getAllPlants(userId);
  },

  getPlant(userId: string, id: string): Plant | null {
    return db.getPlantById(userId, id);
  },

  createPlant(userId: string, input: CreatePlantInput): Plant {
    const validInput = CreatePlantInputSchema.parse(input);
    return db.createPlant(userId, validInput);
  },

  updatePlant(userId: string, id: string, input: UpdatePlantInput): Plant | null {
    const validInput = UpdatePlantInputSchema.parse(input);
    return db.updatePlant(userId, id, validInput);
  },

  deletePlant(userId: string, id: string): boolean {
    return db.deletePlant(userId, id);
  },
});

export default createPlantService;
