import { describe, expect, it } from 'vitest';
import { levels, tasks, isInteractiveTask, getTask } from './tasks';
import { artefactIds } from './artefacts';
import { chequeHitZoneIds } from './cheque';
import { formatRupees } from './format';
import { getClosingBalance, getTotalCredits, getTotalDebits, transactions } from './statement';
import { incidentReport } from './report';

describe('scene rules', () => {
  it('puts every scan task in a table scene, the only scene where scanning runs', () => {
    for (const task of tasks) {
      if (task.kind !== 'scanOne' && task.kind !== 'scanAll') continue;
      expect(task.scene, `scan task ${task.id} is not a table scene`).toBe('table');
    }
  });
});

describe('hints', () => {
  it('never give away the closing balance', () => {
    const answer = formatRupees(getClosingBalance());
    for (const hint of getTask('l2-t1-closing-balance')?.hints ?? []) {
      expect(hint).not.toContain(answer);
      expect(hint).not.toContain(String(getClosingBalance()));
    }
  });

  it('quote the same totals as the statement', () => {
    const lastHint = getTask('l2-t1-closing-balance')?.hints.at(-1) ?? '';
    expect(lastHint).toContain(formatRupees(getTotalCredits()));
    expect(lastHint).toContain(formatRupees(getTotalDebits()));
  });
});

describe('incident report', () => {
  it('describes every piece of evidence a report task requires', () => {
    for (const task of tasks) {
      if (task.kind !== 'report') continue;
      for (const evidenceId of task.requiredEvidenceIds) {
        expect(
          incidentReport.evidenceDescriptions[evidenceId],
          `no report description for evidence ${evidenceId}`,
        ).toBeTruthy();
      }
    }
  });
});

const transactionIds = new Set(transactions.map((t) => t.id));

function registryFor(task: ReturnType<typeof getTask>): Set<string> | undefined {
  if (!task) return undefined;
  switch (task.kind) {
    case 'scanOne':
    case 'scanAll':
      return artefactIds;
    case 'tap':
      return new Set(chequeHitZoneIds);
    case 'highlight':
      return transactionIds;
    case 'choice':
      // Choice options are inline (optionLabels), not backed by another content registry.
      return undefined;
    default:
      return undefined;
  }
}

describe('every referenced id exists', () => {
  it('every task id in a level exists in the tasks list', () => {
    for (const level of levels) {
      for (const taskId of level.taskIds) {
        expect(
          getTask(taskId),
          `level ${level.id} references missing task ${taskId}`,
        ).toBeDefined();
      }
    }
  });

  it('every task belongs to exactly one level', () => {
    const allLevelTaskIds = levels.flatMap((l) => l.taskIds);
    expect(allLevelTaskIds.sort()).toEqual(tasks.map((t) => t.id).sort());
    expect(new Set(allLevelTaskIds).size).toBe(allLevelTaskIds.length);
  });

  it('every interactive task’s optionIds exist in their backing registry', () => {
    for (const task of tasks) {
      if (!isInteractiveTask(task)) continue;
      const registry = registryFor(task);
      if (!registry) continue;
      for (const optionId of task.optionIds) {
        expect(registry.has(optionId), `task ${task.id} references missing id ${optionId}`).toBe(
          true,
        );
      }
    }
  });

  it('every choice task has a label for each of its option ids', () => {
    for (const task of tasks) {
      if (task.kind !== 'choice') continue;
      for (const optionId of task.optionIds) {
        expect(
          task.optionLabels[optionId],
          `choice ${task.id} missing label for ${optionId}`,
        ).toBeTruthy();
      }
    }
  });

  it('the report task only requires evidence that artefacts.ts actually defines', () => {
    for (const task of tasks) {
      if (task.kind !== 'report') continue;
      for (const evidenceId of task.requiredEvidenceIds) {
        expect(
          artefactIds.has(evidenceId),
          `report ${task.id} requires missing evidence ${evidenceId}`,
        ).toBe(true);
      }
    }
  });
});

describe('every wrong option has feedback', () => {
  it('acceptedIds is always a subset of optionIds', () => {
    for (const task of tasks) {
      if (!isInteractiveTask(task)) continue;
      for (const acceptedId of task.acceptedIds) {
        expect(
          task.optionIds,
          `task ${task.id} accepts an id outside optionIds: ${acceptedId}`,
        ).toContain(acceptedId);
      }
    }
  });

  it('every option id that is not accepted has a feedback entry', () => {
    for (const task of tasks) {
      if (!isInteractiveTask(task)) continue;
      const wrongIds = task.optionIds.filter((id) => !task.acceptedIds.includes(id));

      for (const wrongId of wrongIds) {
        expect(
          task.feedback[wrongId],
          `task ${task.id} missing feedback for wrong option ${wrongId}`,
        ).toBeTruthy();
      }
    }
  });

  it('feedback does not define entries for accepted ids or ids that are not options', () => {
    for (const task of tasks) {
      if (!isInteractiveTask(task)) continue;
      for (const feedbackKey of Object.keys(task.feedback)) {
        expect(
          task.optionIds,
          `task ${task.id} has feedback for non-option id ${feedbackKey}`,
        ).toContain(feedbackKey);
        expect(
          task.acceptedIds,
          `task ${task.id} has redundant feedback for accepted id ${feedbackKey}`,
        ).not.toContain(feedbackKey);
      }
    }
  });
});
