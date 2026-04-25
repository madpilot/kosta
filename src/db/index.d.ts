import type { Plant } from '../models/plant';
export interface DatabaseWrapper {
    getAllPlants(): Plant[];
    getPlantById(id: string): Plant | null;
    createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant;
    updatePlant(id: string, plant: Partial<Plant>): Plant | null;
    deletePlant(id: string): boolean;
    close(): void;
}
//# sourceMappingURL=index.d.ts.map