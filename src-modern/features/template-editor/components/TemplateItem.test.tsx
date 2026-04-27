import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TemplateItem } from './TemplateItem';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('TemplateItem', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
  });

  it('shows a visible remove button for the whole template beside the template title', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <TemplateItem
          template={{ name: 'Development Tasks', tasks: [] }}
          availableWorkItemTypes={['Task']}
          onUpdateName={vi.fn()}
          onRemove={vi.fn()}
          onAddTask={vi.fn()}
          onRemoveTask={vi.fn()}
          onUpdateTaskName={vi.fn()}
          onUpdateTaskWorkItemType={vi.fn()}
          onAddField={vi.fn()}
          onRemoveField={vi.fn()}
          onUpdateFieldName={vi.fn()}
          onUpdateFieldValue={vi.fn()}
          onUpdateFieldType={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain('Remove template');
  });
});
