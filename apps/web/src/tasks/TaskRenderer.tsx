import type { ComponentType } from 'react';
import type { Task } from '@app/content';
import { taskRenderers } from './registry';

/** Renders whichever component the registry has for `task.kind`. */
export function TaskRenderer({ task }: { task: Task }) {
  // The registry guarantees the component for a kind accepts that kind's task; TypeScript can't
  // follow that correlation through an indexed lookup, hence the single widening cast.
  const Renderer = taskRenderers[task.kind] as ComponentType<{ task: Task }>;
  return <Renderer task={task} />;
}
