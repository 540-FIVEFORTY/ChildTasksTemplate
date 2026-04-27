import type { TemplateSetup } from '@core/models';
import type { WorkItemFieldInfo } from '@core/services';

export type WorkItemFieldsByType = Record<string, WorkItemFieldInfo[] | undefined>;

export interface FieldValidationError {
  path: string[];
  message: string;
  severity: 'error' | 'warning';
}

function hasInterpolation(value: string): boolean {
  return /\{[^}]+\}/.test(value);
}

function normalizeAllowedValues(values?: unknown[]): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => String(value))
    .filter((value) => value.trim().length > 0 && value !== '<None>');
}

function isValidInteger(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

function isValidDecimal(value: string): boolean {
  return /^-?\d+([.,]\d+)?$/.test(value.trim());
}

function isValidDate(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !Number.isNaN(Date.parse(trimmed));
}

function isDateLikeField(field: WorkItemFieldInfo): boolean {
  const candidates = [field.referenceName, field.name].filter(Boolean);

  return candidates.some((candidate) => {
    const normalized = candidate.toLowerCase();

    return (
      normalized.endsWith('date') ||
      /(^|[.\s_-])date($|[.\s_-])/.test(normalized)
    );
  });
}

function formatAllowedValues(values: string[]): string {
  return values.join(', ');
}

export function describeExpectedFieldFormat(field: WorkItemFieldInfo): string {
  const allowedValues = normalizeAllowedValues(field.allowedValues);

  if (allowedValues.length > 0) {
    return `Dropdown: ${formatAllowedValues(allowedValues)}`;
  }

  if (field.type === 'dateTime' || isDateLikeField(field)) {
    return 'Date';
  }

  switch (field.type) {
    case 'integer':
      return 'Integer';
    case 'double':
      return 'Decimal number';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Text';
  }
}

function validateFieldValue(
  fieldName: string,
  value: string | undefined,
  metadata: WorkItemFieldInfo
): string | null {
  const trimmed = value?.trim() ?? '';

  if (!trimmed || hasInterpolation(trimmed)) {
    return null;
  }

  const allowedValues = normalizeAllowedValues(metadata.allowedValues);
  if (allowedValues.length > 0 && !allowedValues.includes(trimmed)) {
    return `Value "${trimmed}" is not valid for "${fieldName}". Expected one of: ${formatAllowedValues(allowedValues)}.`;
  }

  if (metadata.type === 'integer' && !isValidInteger(trimmed)) {
    return `Value "${trimmed}" is not valid for "${fieldName}". Expected an integer.`;
  }

  if (metadata.type === 'double' && !isValidDecimal(trimmed)) {
    return `Value "${trimmed}" is not valid for "${fieldName}". Expected a decimal number.`;
  }

  if ((metadata.type === 'dateTime' || isDateLikeField(metadata)) && !isValidDate(trimmed)) {
    return `Value "${trimmed}" is not valid for "${fieldName}". Expected a date.`;
  }

  if (
    metadata.type === 'boolean' &&
    !['true', 'false'].includes(trimmed.toLowerCase())
  ) {
    return `Value "${trimmed}" is not valid for "${fieldName}". Expected true or false.`;
  }

  return null;
}

export function validateTemplateFieldsAgainstMetadata(
  setup: TemplateSetup,
  fieldsByType: WorkItemFieldsByType
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  setup.templates.forEach((template, templateIndex) => {
    template.tasks.forEach((task, taskIndex) => {
      const workItemType = task.workItemType || 'Task';
      const metadataFields = fieldsByType[workItemType];

      if (!metadataFields) {
        return;
      }

      const fieldsByReferenceName = new Map(
        metadataFields.map((field) => [field.referenceName.toLowerCase(), field])
      );

      task.fields.forEach((field, fieldIndex) => {
        const fieldName = field.name.trim();
        if (!fieldName) {
          return;
        }

        const metadata = fieldsByReferenceName.get(fieldName.toLowerCase());
        const path = [
          'templates',
          String(templateIndex),
          'tasks',
          String(taskIndex),
          'fields',
          String(fieldIndex),
        ];

        if (!metadata) {
          errors.push({
            path: [...path, 'name'],
            severity: 'error',
            message: `Field "${fieldName}" is not configured for work item type "${workItemType}" in this project process.`,
          });
          return;
        }

        const valueError = validateFieldValue(fieldName, field.value, metadata);
        if (valueError) {
          errors.push({
            path: [...path, 'value'],
            severity: 'error',
            message: valueError,
          });
        }
      });
    });
  });

  return errors;
}
