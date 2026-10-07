/**
 * Resolve the parent work item from an "Add tasks" action context.
 *
 * The context shape depends on where the action was started:
 * - work item form toolbar: { workItemId, workItemAvailable, isNew, currentProjectGuid }
 * - board card / backlog / query result menus: { id, workItemId?, ids, workItemIds, ... }
 */

export type ParentResolution =
  | { ok: true; workItemId: number; projectId?: string }
  | { ok: false; error: string };

function toId(value: unknown): number | undefined {
  const id = typeof value === 'string' ? Number(value) : value;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : undefined;
}

function toIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(toId).filter((id): id is number => id !== undefined)
    : [];
}

export function resolveParentWorkItem(context: unknown): ParentResolution {
  const ctx = (context ?? {}) as Record<string, unknown>;

  if (ctx.isNew === true) {
    return {
      ok: false,
      error: 'Save the work item before adding child tasks to it.',
    };
  }

  const selectedIds = Array.from(new Set([...toIds(ctx.workItemIds), ...toIds(ctx.ids)]));
  if (selectedIds.length > 1) {
    return {
      ok: false,
      error: 'Several work items are selected. Select a single work item to add child tasks.',
    };
  }

  const workItemId = toId(ctx.workItemId) ?? toId(ctx.id) ?? selectedIds[0];
  if (workItemId === undefined) {
    return {
      ok: false,
      error: 'The selected work item is not available in the current context.',
    };
  }

  const projectId =
    typeof ctx.currentProjectGuid === 'string' && ctx.currentProjectGuid
      ? ctx.currentProjectGuid
      : undefined;

  return { ok: true, workItemId, projectId };
}
