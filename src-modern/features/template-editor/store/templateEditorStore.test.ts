import { afterEach, describe, expect, it } from 'vitest';
import { useTemplateEditorStore } from './templateEditorStore';

describe('useTemplateEditorStore importTemplates', () => {
  afterEach(() => {
    useTemplateEditorStore.setState({
      templateSetup: null,
      isDirty: false,
      validationErrors: [],
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,
    });
  });

  it('imports templates into the current setup', () => {
    useTemplateEditorStore.getState().setTemplateSetup({
      version: 3,
      templates: [{ name: 'Existing', tasks: [] }],
    });

    const result = useTemplateEditorStore.getState().importTemplates([
      { name: 'Imported', tasks: [] },
    ]);

    expect(result.importedNames).toEqual(['Imported']);
    expect(
      useTemplateEditorStore.getState().templateSetup?.templates.map(
        (template) => template.name
      )
    ).toEqual(['Existing', 'Imported']);
    expect(useTemplateEditorStore.getState().isDirty).toBe(true);
  });

  it('rejects duplicate template names case-insensitively', () => {
    useTemplateEditorStore.getState().setTemplateSetup({
      version: 3,
      templates: [{ name: 'Existing', tasks: [] }],
    });

    expect(() =>
      useTemplateEditorStore.getState().importTemplates([
        { name: 'existing', tasks: [] },
      ])
    ).toThrow('Template names already exist: existing');
  });

  it('stores external validation errors and updates error flags', () => {
    useTemplateEditorStore.getState().setValidationErrors([
      {
        path: ['templates', '0', 'tasks', '0', 'fields', '0', 'name'],
        message: 'Field is not configured',
        severity: 'error',
      },
      {
        path: ['templates', '0', 'tasks', '0', 'fields', '0', 'value'],
        message: 'Field value is empty',
        severity: 'warning',
      },
    ]);

    expect(useTemplateEditorStore.getState().validationErrors).toHaveLength(2);
    expect(useTemplateEditorStore.getState().hasErrors).toBe(true);
    expect(useTemplateEditorStore.getState().hasWarnings).toBe(true);
  });

  it('allows saving with empty field values by returning warnings without errors', async () => {
    useTemplateEditorStore.getState().setTemplateSetup({
      version: 3,
      templates: [
        {
          name: 'Template',
          tasks: [
            {
              name: 'Task',
              fields: [{ name: 'System.Description', value: '' }],
            },
          ],
        },
      ],
    });

    const isValid = await useTemplateEditorStore.getState().validate();

    expect(isValid).toBe(true);
    expect(useTemplateEditorStore.getState().hasErrors).toBe(false);
    expect(useTemplateEditorStore.getState().hasWarnings).toBe(true);
  });
});
