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
});
