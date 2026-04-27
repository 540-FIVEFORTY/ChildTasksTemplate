/**
 * FieldItem - Editable field component with autocomplete for field names
 */
import { useMemo, useState, useRef, useCallback } from 'react';
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import type { IListBoxItem } from 'azure-devops-ui/ListBox';
import type { Field, FieldType } from '@core/models';
import type { WorkItemFieldInfo } from '@core/services';
import { describeExpectedFieldFormat } from '@core/utils';

interface FieldSuggestion {
  name: string;
  description: string;
  type: FieldType;
  helpText?: string;
  allowedValues?: string[];
  metadata?: WorkItemFieldInfo;
}

interface FieldItemProps {
  field: Field;
  availableFields: WorkItemFieldInfo[];
  existingFieldNames: string[]; // Names of other fields in the same task (for duplicate check)
  onUpdateName: (name: string) => void;
  onUpdateValue: (value: string) => void;
  onUpdateType: (type: FieldType) => void;
  onRemove: () => void;
}

const FALLBACK_FIELDS: FieldSuggestion[] = [
  // System fields
  { name: 'System.Title', description: 'Title', type: 'text' as const },
  { name: 'System.Description', description: 'Description', type: 'text' as const },
  { name: 'System.AssignedTo', description: 'Assigned To', type: 'text' as const },
  { name: 'System.State', description: 'State', type: 'text' as const },
  { name: 'System.Reason', description: 'Reason', type: 'text' as const },
  { name: 'System.IterationPath', description: 'Iteration Path', type: 'text' as const },
  { name: 'System.AreaPath', description: 'Area Path', type: 'text' as const },
  { name: 'System.Tags', description: 'Tags', type: 'text' as const },
  // Scheduling fields
  { name: 'Microsoft.VSTS.Scheduling.OriginalEstimate', description: 'Original Estimate (hours)', type: 'number' as const },
  { name: 'Microsoft.VSTS.Scheduling.RemainingWork', description: 'Remaining Work (hours)', type: 'number' as const },
  { name: 'Microsoft.VSTS.Scheduling.CompletedWork', description: 'Completed Work (hours)', type: 'number' as const },
  { name: 'Microsoft.VSTS.Scheduling.StoryPoints', description: 'Story Points', type: 'number' as const },
  { name: 'Microsoft.VSTS.Scheduling.Effort', description: 'Effort', type: 'number' as const },
  { name: 'Microsoft.VSTS.Scheduling.Size', description: 'Size', type: 'number' as const },
  // Common fields
  { name: 'Microsoft.VSTS.Common.Priority', description: 'Priority', type: 'number' as const },
  { name: 'Microsoft.VSTS.Common.Severity', description: 'Severity', type: 'text' as const },
  { name: 'Microsoft.VSTS.Common.Activity', description: 'Activity', type: 'text' as const },
  { name: 'Microsoft.VSTS.Common.BusinessValue', description: 'Business Value', type: 'number' as const },
  { name: 'Microsoft.VSTS.Common.StackRank', description: 'Stack Rank', type: 'number' as const },
  { name: 'Microsoft.VSTS.Common.AcceptanceCriteria', description: 'Acceptance Criteria', type: 'text' as const },
  { name: 'Microsoft.VSTS.Common.ValueArea', description: 'Value Area', type: 'text' as const },
  // Build fields
  { name: 'Microsoft.VSTS.Build.IntegrationBuild', description: 'Integration Build', type: 'text' as const },
  { name: 'Microsoft.VSTS.Build.FoundIn', description: 'Found In', type: 'text' as const },
];

// Known numeric fields in Azure DevOps (comprehensive list)
const NUMERIC_FIELDS = [
  // Scheduling fields
  'microsoft.vsts.scheduling.remainingwork',
  'microsoft.vsts.scheduling.originalestimate',
  'microsoft.vsts.scheduling.completedwork',
  'microsoft.vsts.scheduling.storypoints',
  'microsoft.vsts.scheduling.effort',
  'microsoft.vsts.scheduling.size',
  'microsoft.vsts.scheduling.baselineeffort',
  'microsoft.vsts.scheduling.baselinework',
  'microsoft.vsts.scheduling.duedate',
  // Common fields
  'microsoft.vsts.common.priority',
  'microsoft.vsts.common.stackrank',
  'microsoft.vsts.common.businessvalue',
  'microsoft.vsts.common.timecriticality',
  'microsoft.vsts.common.risk',
  'microsoft.vsts.common.severity',
  'microsoft.vsts.common.rating',
  // CMMI fields
  'microsoft.vsts.cmmi.blocked',
  'microsoft.vsts.cmmi.committedwork',
  'microsoft.vsts.cmmi.estimatedwork',
  // Test fields
  'microsoft.vsts.tcm.automationstatus',
  'microsoft.vsts.tcm.queryid',
  // Build fields
  'microsoft.vsts.build.integrationbuild',
  // Agile fields
  'microsoft.vsts.agile.storypoints',
  // Scrum fields
  'microsoft.vsts.common.backlogpriority',
  // System fields (numeric)
  'system.id',
  'system.rev',
  'system.watermark',
  'system.commentcount',
  'system.relatedlinkcount',
  'system.externallinkcount',
  'system.hyperlinkcount',
  'system.attachedfilecount',
  // Custom common patterns (often created by organizations)
  'custom.hours',
  'custom.points',
  'custom.estimate',
  'custom.effort',
  'custom.cost',
  'custom.budget',
  'custom.score',
  'custom.weight',
  'custom.percentage',
  'custom.count',
  'custom.quantity',
  'custom.duration',
];

/**
 * Check if a field name is a known numeric field
 */
function isNumericField(fieldName: string): boolean {
  return NUMERIC_FIELDS.includes(fieldName.toLowerCase());
}

/**
 * Check if a value is a valid number (supports comma or period as decimal separator)
 */
function isValidNumericValue(value: string): boolean {
  if (!value || value.trim() === '') return true; // Empty is valid (optional field)

  // Allow template variables like {System.IterationPath}
  if (value.includes('{') && value.includes('}')) return true;

  // Strict numeric check: only digits, optional minus, optional decimal (comma or period)
  const trimmed = value.trim();
  const numericPattern = /^-?\d+([.,]\d+)?$/;
  return numericPattern.test(trimmed);
}

/**
 * Normalize numeric values: converts comma to period for decimals
 * Only normalizes if the value looks like a number (e.g., "9,5" -> "9.5")
 */
function normalizeNumericValue(value: string): string {
  if (!value) return value;

  // Check if value looks like a decimal number with comma
  // Matches: 9,5 or 10,25 or -3,14 etc.
  if (/^-?\d+,\d+$/.test(value.trim())) {
    return value.replace(',', '.');
  }

  return value;
}

function metadataTypeToFieldType(type?: string): FieldType {
  return type === 'integer' || type === 'double' ? 'number' : 'text';
}

function normalizeAllowedValues(values?: unknown[]): string[] | undefined {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }

  const normalized = values
    .map((value) => {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return String(value);
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;

        if (
          typeof record.name === 'string' ||
          typeof record.name === 'number' ||
          typeof record.name === 'boolean'
        ) {
          return String(record.name);
        }

        if (
          typeof record.value === 'string' ||
          typeof record.value === 'number' ||
          typeof record.value === 'boolean'
        ) {
          return String(record.value);
        }

        if (
          typeof record.displayName === 'string' ||
          typeof record.displayName === 'number' ||
          typeof record.displayName === 'boolean'
        ) {
          return String(record.displayName);
        }
      }

      return JSON.stringify(value);
    })
    .filter((value) => value.trim().length > 0 && value !== '<None>');

  return normalized.length > 0 ? normalized : undefined;
}

export function FieldItem({
  field,
  availableFields,
  existingFieldNames,
  onUpdateName,
  onUpdateValue,
  onUpdateType,
  onRemove,
}: FieldItemProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showValueSuggestions, setShowValueSuggestions] = useState(false);
  const [searchText, setSearchText] = useState(field.name);
  const nameInputRef = useRef<HTMLDivElement>(null);

  // Check for duplicate field name
  const isDuplicate = useMemo(() => {
    if (!field.name.trim()) return false;
    return existingFieldNames.some(
      (name) => name.toLowerCase() === field.name.toLowerCase()
    );
  }, [field.name, existingFieldNames]);

  const availableFieldOptions = useMemo(() => {
    if (availableFields.length === 0) {
      return FALLBACK_FIELDS;
    }

    return availableFields.map((availableField): FieldSuggestion => ({
      name: availableField.referenceName,
      description: availableField.name,
      type: metadataTypeToFieldType(availableField.type),
      helpText: availableField.helpText,
      allowedValues: normalizeAllowedValues(availableField.allowedValues),
      metadata: availableField,
    }));
  }, [availableFields]);

  const selectedFieldOption = useMemo(
    () =>
      availableFieldOptions.find(
        (availableField) =>
          availableField.name.toLowerCase() === field.name.toLowerCase()
      ),
    [availableFieldOptions, field.name]
  );

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!searchText) return availableFieldOptions;
    const lower = searchText.toLowerCase();
    return availableFieldOptions.filter(
      (f) =>
        !existingFieldNames.some(
          (name) => name.toLowerCase() === f.name.toLowerCase()
        ) &&
        (
          f.name.toLowerCase().includes(lower) ||
          f.description.toLowerCase().includes(lower)
        )
    );
  }, [availableFieldOptions, existingFieldNames, searchText]);

  const filteredValueSuggestions = useMemo(() => {
    const allowedValues = selectedFieldOption?.allowedValues;
    if (!allowedValues || allowedValues.length === 0) {
      return [];
    }

    const currentValue = (field.value || '').toLowerCase();

    if (!currentValue) {
      return allowedValues;
    }

    return allowedValues.filter((value) =>
      value.toLowerCase().includes(currentValue)
    );
  }, [field.value, selectedFieldOption?.allowedValues]);

  const allowedValueItems = useMemo<IListBoxItem[]>(
    () =>
      selectedFieldOption?.allowedValues?.map((value) => ({
        id: value,
        text: value,
      })) ?? [],
    [selectedFieldOption?.allowedValues]
  );

  const allowedValueSelection = useMemo(() => {
    const selection = new DropdownSelection();
    const index = allowedValueItems.findIndex((item) => item.id === field.value);

    if (index >= 0) {
      selection.select(index);
    }

    return selection;
  }, [allowedValueItems, field.value]);

  // Handle name input change
  const handleNameChange = useCallback((_: unknown, value: string) => {
    setSearchText(value);
    onUpdateName(value);
    setShowSuggestions(true);
  }, [onUpdateName]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: FieldSuggestion) => {
      setSearchText(suggestion.name);
      onUpdateName(suggestion.name);
      onUpdateType(suggestion.type);
      setShowSuggestions(false);
    },
    [onUpdateName, onUpdateType]
  );

  // Normalize on blur only
  const handleValueBlur = () => {
    const normalized = normalizeNumericValue(field.value || '');
    if (normalized !== field.value) {
      onUpdateValue(normalized);
    }
  };

  const handleValueSuggestionSelect = useCallback(
    (value: string) => {
      onUpdateValue(value);
      setShowValueSuggestions(false);
    },
    [onUpdateValue]
  );

  const handleAllowedValueSelect = useCallback(
    (_event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
      onUpdateValue(String(item.id));
    },
    [onUpdateValue]
  );

  // Check if this is a known numeric field
  const isKnownNumeric = useMemo(
    () =>
      selectedFieldOption?.type === 'number' || isNumericField(field.name),
    [field.name, selectedFieldOption?.type]
  );

  // Check if this field should be validated as numeric (known OR user-selected)
  const isNumeric = useMemo(
    () => isKnownNumeric || field.type === 'number',
    [isKnownNumeric, field.type]
  );

  const hasInvalidNumericValue = useMemo(
    () => isNumeric && !isValidNumericValue(field.value || ''),
    [isNumeric, field.value]
  );

  const hasInvalidAllowedValue = useMemo(() => {
    const value = field.value?.trim() ?? '';
    const allowedValues = selectedFieldOption?.allowedValues;

    if (!value || !allowedValues || allowedValues.length === 0) {
      return false;
    }

    if (value.includes('{') && value.includes('}')) {
      return false;
    }

    return !allowedValues.includes(value);
  }, [field.value, selectedFieldOption?.allowedValues]);

  const hasInvalidValue = hasInvalidNumericValue || hasInvalidAllowedValue;

  const expectedFormat = useMemo(() => {
    if (selectedFieldOption?.metadata) {
      return describeExpectedFieldFormat(selectedFieldOption.metadata);
    }

    if (isNumeric) {
      return 'Decimal number';
    }

    return 'Text or parent-field value';
  }, [isNumeric, selectedFieldOption?.metadata]);

  const formatExample = useMemo(() => {
    if (expectedFormat !== 'Decimal number') {
      return null;
    }

    return 'Example: 2.5 or 2,5';
  }, [expectedFormat]);

  const valueErrorStyle: React.CSSProperties = hasInvalidValue
    ? {
        border: '2px solid #d32f2f',
        backgroundColor: '#fdecea',
        borderRadius: '4px',
      }
    : {};

  const nameErrorStyle: React.CSSProperties = isDuplicate
    ? {
        border: '2px solid #d32f2f',
        backgroundColor: '#fdecea',
        borderRadius: '4px',
      }
    : {};

  const hasOpenNameSuggestions = showSuggestions && filteredSuggestions.length > 0;

  return (
    <div
      className={`field-item${
        hasOpenNameSuggestions ? ' field-item--name-suggestions-open' : ''
      }`}
    >
      <div className="field-item__row">
        <div className="field-item__name-container" ref={nameInputRef} style={nameErrorStyle}>
          <TextField
            value={searchText}
            onChange={handleNameChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Field name (type or select)"
            className="field-item__name"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="field-item__suggestions">
              {filteredSuggestions.slice(0, 12).map((suggestion) => (
                <div
                  key={suggestion.name}
                  className="field-item__suggestion"
                  onMouseDown={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="field-item__suggestion-name">{suggestion.name}</span>
                  <span className="field-item__suggestion-desc">
                    {suggestion.description}
                    {suggestion.helpText ? ` - ${suggestion.helpText}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={valueErrorStyle}>
          <div className="field-item__value-container" title={`Expected format: ${expectedFormat}`}>
            {allowedValueItems.length > 0 ? (
              <Dropdown
                items={allowedValueItems}
                selection={allowedValueSelection}
                onSelect={handleAllowedValueSelect}
                placeholder={`Select a value (${expectedFormat})`}
                className="field-item__value field-item__value-dropdown"
              />
            ) : (
              <>
                <TextField
                  value={field.value || ''}
                  onChange={(_, value) => onUpdateValue(value)}
                  onBlur={() => {
                    handleValueBlur();
                    setTimeout(() => setShowValueSuggestions(false), 200);
                  }}
                  onFocus={() => setShowValueSuggestions(true)}
                  placeholder={`Value (${expectedFormat})`}
                  className="field-item__value"
                />
                {showValueSuggestions && filteredValueSuggestions.length > 0 && (
                  <div className="field-item__suggestions field-item__suggestions--value">
                    {filteredValueSuggestions.map((value) => (
                      <div
                        key={value}
                        className="field-item__suggestion"
                        onMouseDown={() => handleValueSuggestionSelect(value)}
                      >
                        <span className="field-item__suggestion-name">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <Button
          iconProps={{ iconName: 'Delete' }}
          subtle
          onClick={onRemove}
          tooltipProps={{ text: 'Remove field' }}
        />
      </div>
      {isDuplicate && (
        <div className="field-item__error field-item__error--name">
          This field name is already used in this task
        </div>
      )}
      {hasInvalidValue && (
        <div className="field-item__error">
          {hasInvalidAllowedValue
            ? 'This field value is not in the allowed values list'
            : 'This field requires a numeric value'}
        </div>
      )}
      {selectedFieldOption?.metadata && (
        <div className="field-item__hint">
          Expected format: {expectedFormat}
          {formatExample ? ` - ${formatExample}` : ''}
        </div>
      )}
    </div>
  );
}
