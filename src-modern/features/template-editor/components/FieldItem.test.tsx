import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldItem } from './FieldItem';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('FieldItem', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
  });

  it('uses a dropdown instead of free text when the selected field has allowed values', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <FieldItem
          field={{ name: 'Microsoft.VSTS.Common.Activity', value: 'Development' }}
          availableFields={[
            {
              name: 'Activity',
              referenceName: 'Microsoft.VSTS.Common.Activity',
              type: 'string',
              allowedValues: ['Development', 'Testing'],
            },
          ]}
          existingFieldNames={[]}
          onUpdateName={vi.fn()}
          onUpdateValue={vi.fn()}
          onUpdateType={vi.fn()}
          onRemove={vi.fn()}
        />
      );
    });

    expect(container.querySelector('.field-item__value-dropdown')).not.toBeNull();
    expect(
      container.querySelector('.field-item__value-dropdown input[type="button"]')
    ).not.toBeNull();
    expect(
      container.querySelector('.field-item__value input[type="text"]')
    ).toBeNull();
  });

  it('uses free text when Azure DevOps only returns the empty picklist placeholder', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <FieldItem
          field={{ name: 'Microsoft.VSTS.Build.IntegrationBuild', value: '' }}
          availableFields={[
            {
              name: 'Integration Build',
              referenceName: 'Microsoft.VSTS.Build.IntegrationBuild',
              type: 'string',
              allowedValues: ['<None>'],
            },
          ]}
          existingFieldNames={[]}
          onUpdateName={vi.fn()}
          onUpdateValue={vi.fn()}
          onUpdateType={vi.fn()}
          onRemove={vi.fn()}
        />
      );
    });

    expect(container.querySelector('.field-item__value-dropdown')).toBeNull();
    expect(
      container.querySelector('.field-item__value input')
    ).not.toBeNull();
  });

  it('shows a decimal value example when the selected field expects a decimal number', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <FieldItem
          field={{ name: 'Microsoft.VSTS.Scheduling.OriginalEstimate', value: '' }}
          availableFields={[
            {
              name: 'Original Estimate',
              referenceName: 'Microsoft.VSTS.Scheduling.OriginalEstimate',
              type: 'double',
            },
          ]}
          existingFieldNames={[]}
          onUpdateName={vi.fn()}
          onUpdateValue={vi.fn()}
          onUpdateType={vi.fn()}
          onRemove={vi.fn()}
        />
      );
    });

    expect(container.querySelector('.field-item__hint')?.textContent).toContain(
      'Expected format: Decimal number - Example: 2.5 or 2,5'
    );
  });
});
