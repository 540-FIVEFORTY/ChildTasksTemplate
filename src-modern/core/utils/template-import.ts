import type { Template } from '@core/models';
import { SettingsUpgrade } from './settings-upgrade';

interface SingleTemplateShape {
  name: string;
  tasks: unknown[];
}

function isSingleTemplateShape(value: unknown): value is SingleTemplateShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { name?: unknown }).name === 'string' &&
    Array.isArray((value as { tasks?: unknown }).tasks)
  );
}

export function parseTemplateImport(text: string): Template[] {
  if (!text.trim()) {
    throw new Error('Paste JSON for a template or template setup.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON syntax: ${(error as Error).message}`);
  }

  if (isSingleTemplateShape(parsed)) {
    return SettingsUpgrade.upgradeToCurrent({
      version: 3,
      templates: [parsed],
    }).templates;
  }

  const upgraded = SettingsUpgrade.upgradeToCurrent(parsed);

  if (upgraded.templates.length === 0) {
    throw new Error('Imported JSON does not contain any templates.');
  }

  return upgraded.templates;
}
