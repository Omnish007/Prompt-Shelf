import { SEED_PROMPTS_1 } from "./seed-prompts/prompts-1";
import { SEED_PROMPTS_2 } from "./seed-prompts/prompts-2";
import { SEED_PROMPTS_3 } from "./seed-prompts/prompts-3";
import { SEED_PROMPTS_4 } from "./seed-prompts/prompts-4";
import { SEED_PROMPTS_5 } from "./seed-prompts/prompts-5";
export {
  SEED_LIBRARY_VERSION,
  SEED_COLLECTIONS,
} from "./seed-prompts/collections";
export type { SeedPrompt } from "./seed-prompts/types";

import type { SeedPrompt } from "./seed-prompts/types";

export const SEED_PROMPTS: SeedPrompt[] = [
  ...SEED_PROMPTS_1,
  ...SEED_PROMPTS_2,
  ...SEED_PROMPTS_3,
  ...SEED_PROMPTS_4,
  ...SEED_PROMPTS_5,
];
