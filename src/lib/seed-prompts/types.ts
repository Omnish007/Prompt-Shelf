/** Curated built-in prompt library. Keep each prompt directly useful without requiring extra context. */
export interface SeedPrompt {
  title: string;
  description: string;
  collection: string;
  tags: string[];
  content: string;
  favorite?: boolean;
  pinned?: boolean;
}
