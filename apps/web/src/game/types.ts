export type TaskStatus = 'locked' | 'available' | 'inProgress' | 'completed';

export interface TaskProgress {
  status: TaskStatus;
  /** Counts wrong submissions only — it's what escalating hints key off of. */
  attempts: number;
  /** Ids already confirmed correct for a scanAll task (e.g. both KYC documents). */
  scannedIds: string[];
  /** The most recent feedback/success text for the viewed task, for the UI to render. */
  lastFeedback: string | null;
  /**
   * The last wrong code entered at a passkey task — what its lights and hints describe. Always
   * digits (see `isPasskeyAttempt`), and cleared once the task is solved. Saves from before
   * this field existed don't have it, so read it through `getLastSubmission`.
   */
  lastSubmission: string | null;
}

/** The machine's top-level states. */
export type GameStateValue = 'notStarted' | 'inGame' | 'missionComplete';

export interface GameContext {
  /** The task currently on screen — what GOTO_TASK and START move. */
  viewedTaskId: string;
  tasks: Record<string, TaskProgress>;
  reportSubmitted: boolean;
}

export type GameEvent =
  | { type: 'START' }
  | { type: 'ARTEFACT_SCANNED'; id: string }
  | { type: 'TAP_ZONE'; id: string }
  | { type: 'HIGHLIGHT_ROW'; id: string }
  | { type: 'CHOOSE'; id: string }
  | { type: 'SUBMIT_PASSKEY'; code: string }
  | { type: 'SUBMIT_REPORT' }
  | { type: 'GOTO_TASK'; taskId: string }
  | { type: 'RESET' }
  /**
   * Replaces the whole game with a save made elsewhere (see `restoreGame`). Not something a
   * screen sends: it is how a newer save from the server takes over.
   */
  | { type: 'HYDRATE'; save: GameSave };

/** A whole game: which state the machine is in, and its context. */
export interface GameSave {
  value: GameStateValue;
  context: GameContext;
}
