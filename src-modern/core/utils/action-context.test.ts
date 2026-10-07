import { describe, expect, it } from 'vitest';

import { resolveParentWorkItem } from './action-context';

describe('resolveParentWorkItem', () => {
  it('reads the work item form toolbar context', () => {
    expect(
      resolveParentWorkItem({
        workItemId: 198608,
        workItemAvailable: true,
        isNew: false,
        currentProjectGuid: 'project-1',
      })
    ).toEqual({ ok: true, workItemId: 198608, projectId: 'project-1' });
  });

  it('does not require workItemAvailable when an id is present', () => {
    expect(
      resolveParentWorkItem({ workItemId: 198608, workItemAvailable: false })
    ).toEqual({ ok: true, workItemId: 198608, projectId: undefined });
  });

  it('reads a board card or backlog context', () => {
    expect(resolveParentWorkItem({ id: 42, ids: [42], workItemIds: [42] })).toEqual({
      ok: true,
      workItemId: 42,
      projectId: undefined,
    });
  });

  it('reads a query result context that only has a list of ids', () => {
    expect(resolveParentWorkItem({ workItemIds: ['77'] })).toEqual({
      ok: true,
      workItemId: 77,
      projectId: undefined,
    });
  });

  it('refuses an unsaved work item', () => {
    const result = resolveParentWorkItem({ workItemId: 0, isNew: true });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('Save the work item');
  });

  it('refuses a multiple selection', () => {
    const result = resolveParentWorkItem({ id: 1, ids: [1, 2], workItemIds: [1, 2] });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('single work item');
  });

  it('reports a missing work item', () => {
    expect(resolveParentWorkItem(undefined)).toEqual({
      ok: false,
      error: 'The selected work item is not available in the current context.',
    });
  });
});
