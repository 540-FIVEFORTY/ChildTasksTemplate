import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '@core/models';
import { TaskItem } from './TaskItem';

vi.mock('@core/services', () => ({
  workItemMetadataService: {
    getFieldsForWorkItemType: vi.fn().mockResolvedValue([]),
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('TaskItem', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    container = null;
    root = null;
  });

  function renderTask(task: Task, availableWorkItemTypes: string[], queryClient: QueryClient) {
    act(() => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <TaskItem
            task={task}
            taskIndex={0}
            availableWorkItemTypes={availableWorkItemTypes}
            onUpdateName={vi.fn()}
            onUpdateWorkItemType={vi.fn()}
            onRemove={vi.fn()}
            onAddField={vi.fn()}
            onRemoveField={vi.fn()}
            onUpdateFieldName={vi.fn()}
            onUpdateFieldValue={vi.fn()}
            onUpdateFieldType={vi.fn()}
          />
        </QueryClientProvider>
      );
    });
  }

  function displayedWorkItemType(): string | null | undefined {
    const input = container!.querySelector<HTMLInputElement>('.task-item__type input');
    return input?.value ?? container!.querySelector('.task-item__type')?.textContent;
  }

  it('keeps showing the saved work item type when the project type list loads', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const queryClient = new QueryClient();
    const task: Task = { name: 'Design', workItemType: 'Task', fields: [] };

    // First render uses the fallback list, where Task is the first entry.
    renderTask(task, ['Task', 'Bug', 'User Story'], queryClient);
    expect(displayedWorkItemType()).toContain('Task');

    // The project's types arrive sorted alphabetically, so Bug is now first.
    renderTask(task, ['Bug', 'Epic', 'Feature', 'Task', 'User Story'], queryClient);
    expect(displayedWorkItemType()).toContain('Task');
    expect(displayedWorkItemType()).not.toContain('Bug');
  });

  it('shows a saved work item type that the project list does not contain', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const queryClient = new QueryClient();

    renderTask(
      { name: 'Workshop', workItemType: 'Workshop', fields: [] },
      ['Bug', 'Task'],
      queryClient
    );

    expect(displayedWorkItemType()).toContain('Workshop');
  });
});
