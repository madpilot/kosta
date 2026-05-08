import { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema } from './models/plant';

describe('OpenAPI schemas', () => {
  it('PlantSchema has safeParse', () => {
    expect(typeof PlantSchema.safeParse).toBe('function');
  });

  it('CreatePlantInputSchema has safeParse', () => {
    expect(typeof CreatePlantInputSchema.safeParse).toBe('function');
  });

  it('UpdatePlantInputSchema has safeParse', () => {
    expect(typeof UpdatePlantInputSchema.safeParse).toBe('function');
  });
});
