import { ChoiceTask } from './ChoiceTask';
import { HighlightTask } from './HighlightTask';
import { NarrativeTask } from './NarrativeTask';
import { PasskeyTask } from './PasskeyTask';
import { ReportTask } from './ReportTask';
import { ScanTask } from './ScanTask';
import { TapTask } from './TapTask';
import type { TaskRendererMap } from './types';

/**
 * One renderer per task kind. The mapped type makes a missing or mistyped entry a compile
 * error, so adding a kind to packages/content can't silently leave it unrenderable.
 */
export const taskRenderers: TaskRendererMap = {
  scanOne: ScanTask,
  scanAll: ScanTask,
  tap: TapTask,
  highlight: HighlightTask,
  choice: ChoiceTask,
  passkey: PasskeyTask,
  narrative: NarrativeTask,
  report: ReportTask,
};
