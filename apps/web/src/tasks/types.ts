import type { ComponentType } from 'react';
import type { Task, TaskKind } from '@app/content';

export type TaskOfKind<K extends TaskKind> = Extract<Task, { kind: K }>;

export type TaskRendererMap = {
  [K in TaskKind]: ComponentType<{ task: TaskOfKind<K> }>;
};
