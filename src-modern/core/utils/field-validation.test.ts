import { describe, expect, it } from 'vitest';

import type { TemplateSetup } from '@core/models';
import type { WorkItemFieldInfo } from '@core/services';
import {
  describeExpectedFieldFormat,
  validateTemplateFieldsAgainstMetadata,
} from './field-validation';

const taskFields: WorkItemFieldInfo[] = [
  {
    name: 'Priority',
    referenceName: 'Microsoft.VSTS.Common.Priority',
    type: 'integer',
    allowedValues: [1, 2, 3, 4],
  },
  {
    name: 'Activity',
    referenceName: 'Microsoft.VSTS.Common.Activity',
    type: 'string',
    allowedValues: ['Development', 'Testing'],
  },
  {
    name: 'Remaining Work',
    referenceName: 'Microsoft.VSTS.Scheduling.RemainingWork',
    type: 'double',
  },
  {
    name: 'Count',
    referenceName: 'Custom.Count',
    type: 'integer',
  },
  {
    name: 'Due Date',
    referenceName: 'Custom.DueDate',
    type: 'dateTime',
  },
];

function setupWithFields(fields: TemplateSetup['templates'][number]['tasks'][number]['fields']): TemplateSetup {
  return {
    version: 3,
    templates: [
      {
        name: 'Template',
        tasks: [
          {
            name: 'Task',
            workItemType: 'Task',
            fields,
          },
        ],
      },
    ],
  };
}

describe('validateTemplateFieldsAgainstMetadata', () => {
  it('reports fields that are not present on the selected work item type', () => {
    const errors = validateTemplateFieldsAgainstMetadata(
      setupWithFields([{ name: 'Microsoft.VSTS.Scheduling.Effort', value: '3' }]),
      { Task: taskFields }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        severity: 'error',
        message:
          'Field "Microsoft.VSTS.Scheduling.Effort" is not configured for work item type "Task" in this project process.',
      }),
    ]);
  });

  it('reports values outside a field allowed-value list', () => {
    const errors = validateTemplateFieldsAgainstMetadata(
      setupWithFields([
        { name: 'Microsoft.VSTS.Common.Activity', value: 'Documentation' },
      ]),
      { Task: taskFields }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        severity: 'error',
        message:
          'Value "Documentation" is not valid for "Microsoft.VSTS.Common.Activity". Expected one of: Development, Testing.',
      }),
    ]);
  });

  it('validates integer, decimal, and date formats', () => {
    const errors = validateTemplateFieldsAgainstMetadata(
      setupWithFields([
        { name: 'Microsoft.VSTS.Common.Priority', value: '1.5' },
        { name: 'Custom.Count', value: '1.5' },
        { name: 'Microsoft.VSTS.Scheduling.RemainingWork', value: '2,5' },
        { name: 'Custom.DueDate', value: 'not-a-date' },
      ]),
      { Task: taskFields }
    );

    expect(errors.map((error) => error.message)).toEqual([
      'Value "1.5" is not valid for "Microsoft.VSTS.Common.Priority". Expected one of: 1, 2, 3, 4.',
      'Value "1.5" is not valid for "Custom.Count". Expected an integer.',
      'Value "not-a-date" is not valid for "Custom.DueDate". Expected a date.',
    ]);
  });

  it('allows parent-field interpolation values because their final type is known only at creation time', () => {
    const errors = validateTemplateFieldsAgainstMetadata(
      setupWithFields([
        { name: 'Microsoft.VSTS.Common.Priority', value: '{Microsoft.VSTS.Common.Priority}' },
        { name: 'Microsoft.VSTS.Common.Activity', value: '{System.State}' },
      ]),
      { Task: taskFields }
    );

    expect(errors).toEqual([]);
  });
});

describe('describeExpectedFieldFormat', () => {
  it('describes dropdown, integer, decimal, and date fields', () => {
    expect(describeExpectedFieldFormat(taskFields[0])).toBe('Dropdown: 1, 2, 3, 4');
    expect(describeExpectedFieldFormat(taskFields[2])).toBe('Decimal number');
    expect(describeExpectedFieldFormat(taskFields[4])).toBe('Date');
    expect(describeExpectedFieldFormat({ name: 'Title', referenceName: 'System.Title', type: 'string' })).toBe('Text');
  });

  it('ignores Azure DevOps empty picklist placeholders', () => {
    expect(
      describeExpectedFieldFormat({
        name: 'Integration Build',
        referenceName: 'Microsoft.VSTS.Build.IntegrationBuild',
        type: 'string',
        allowedValues: ['<None>'],
      })
    ).toBe('Text');
  });
});
