import { z } from 'zod';

/**
 * Scene types, per CLAUDE.md rule 4. Camera/QR decoding is only ever wired up in `table` scenes.
 */
export const sceneTypeSchema = z.enum(['call', 'table', 'screen', 'cinematic']);
export type SceneType = z.infer<typeof sceneTypeSchema>;

/** Unique identifier for a physical artefact, mapped to the QR code printed on it. */
export const artefactIdSchema = z.string().min(1);
export type ArtefactId = z.infer<typeof artefactIdSchema>;
