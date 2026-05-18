import guNameJson from './gu_name.json';
import populationJson from './population_by_district.json';
import densityJson from './population_density_by_district.json';

export type GuNameEntry = { district: string; rename: string };
export type PopulationEntry = { district: string; total_population: number };
export type DensityEntry = { district: string; population_density: number };

export const GU_NAME = guNameJson as GuNameEntry[];
export const POPULATION = populationJson as PopulationEntry[];
export const POPULATION_DENSITY = densityJson as DensityEntry[];

export const BUSAN_DISTRICTS_KO: string[] = GU_NAME.map((g) => g.rename);

const TO_KOREAN = new Map(GU_NAME.map((g) => [g.district, g.rename]));
const TO_ENGLISH = new Map(GU_NAME.map((g) => [g.rename, g.district]));

export function toKoreanDistrict(id: string): string | null {
  return TO_KOREAN.get(id) ?? null;
}

export function toEnglishDistrict(name: string): string | null {
  return TO_ENGLISH.get(name) ?? null;
}

export function getPopulation(district: string): number {
  return POPULATION.find((p) => p.district === district)?.total_population ?? 0;
}

export function getPopulationDensity(district: string): number {
  return POPULATION_DENSITY.find((p) => p.district === district)?.population_density ?? 0;
}

export const TOTAL_POPULATION = POPULATION.reduce((s, c) => s + c.total_population, 0);
