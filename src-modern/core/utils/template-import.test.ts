import { describe, expect, it } from 'vitest';
import { parseTemplateImport } from './template-import';

describe('parseTemplateImport', () => {
  it('parses a single template object', () => {
    const templates = parseTemplateImport(`{
      "name": "Imported Template",
      "tasks": [
        {
          "name": "Imported Task",
          "fields": [{ "name": "System.Title", "value": "Test" }]
        }
      ]
    }`);

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Imported Template');
    expect(templates[0].tasks[0].workItemType).toBe('Task');
  });

  it('parses a full template setup and returns all templates', () => {
    const templates = parseTemplateImport(`{
      "version": 3,
      "templates": [
        { "name": "Template A", "tasks": [] },
        { "name": "Template B", "tasks": [] }
      ]
    }`);

    expect(templates.map((template) => template.name)).toEqual([
      'Template A',
      'Template B',
    ]);
  });

  it('upgrades legacy tasks-only JSON into a default template', () => {
    const templates = parseTemplateImport(`{
      "tasks": [
        {
          "name": "Legacy Task",
          "fields": [{ "name": "System.Title", "value": "Legacy" }]
        }
      ]
    }`);

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('default');
    expect(templates[0].tasks[0].name).toBe('Legacy Task');
  });

  it('throws for invalid JSON', () => {
    expect(() => parseTemplateImport('{not-json}')).toThrow(
      'Invalid JSON syntax'
    );
  });

  it('throws for empty input', () => {
    expect(() => parseTemplateImport('   ')).toThrow(
      'Paste JSON for a template or template setup.'
    );
  });
});
