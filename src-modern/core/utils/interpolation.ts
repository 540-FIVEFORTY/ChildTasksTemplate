/**
 * String interpolation utility using pupa
 */
import pupa from 'pupa';
import type { WorkItem } from 'azure-devops-extension-api/WorkItemTracking';

/**
 * Interpolate template string with parent work item data
 */
export function interpolate(
  text: string | null | undefined,
  parent: WorkItem
): string | null {
  if (!text) {
    return null;
  }

  // Build data object from parent fields
  const data: Record<string, any> = {};

  // Add all fields with nested structure support
  const keys = Object.keys(parent.fields);
  for (const key of keys) {
    try {
      setNestedValue(data, key, parent.fields[key]);
    } catch (error) {
      console.error(
        `Error setting field value. Name '${key}'; Value '${parent.fields[key]}'.`,
        error
      );
    }
  }

  // Add top-level properties
  data.id = parent.id;
  data.rev = parent.rev;
  data.url = parent.url;

  // Interpolate
  return pupa(text, data);
}

/**
 * Set nested value in object (e.g., "System.Title" -> obj.System.Title)
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.');

  if (parts.length === 1) {
    obj[path] = value;
    return;
  }

  const [first, ...rest] = parts;

  if (!obj[first]) {
    obj[first] = {};
  }

  setNestedValue(obj[first], rest.join('.'), value);
}
