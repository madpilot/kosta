import type { DatabaseWrapper } from '../db/index';
import type { Plant, CreatePlantInput, UpdatePlantInput } from '../models/plant';
export declare const createPlantService: (db: DatabaseWrapper) => {
    listPlants(): Plant[];
    getPlant(id: string): Plant | null;
    createPlant(input: CreatePlantInput): Plant;
    updatePlant(id: string, input: UpdatePlantInput): Plant | null;
    deletePlant(id: string): boolean;
};
export default createPlantService;
//# sourceMappingURL=plants.d.ts.map