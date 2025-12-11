/**
 * FieldItem - Editable field component with autocomplete for field names
 */
import { useMemo, useState, useRef, useCallback } from 'react';
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import type { Field, FieldType } from '@core/models';

interface FieldItemProps {
  field: Field;
  existingFieldNames: string[]; // Names of other fields in the same task (for duplicate check)
  onUpdateName: (name: string) => void;
  onUpdateValue: (value: string) => void;
  onUpdateType: (type: FieldType) => void;
  onRemove: () => void;
}

// Common Azure DevOps field names for autocomplete
const COMMON_FIELDS = [
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

// Type selector options
const TYPE_OPTIONS = [
  { id: 'text', text: 'Text' },
  { id: 'number', text: 'Number' },
];

export function FieldItem({
  field,
  existingFieldNames,
  onUpdateName,
  onUpdateValue,
  onUpdateType,
  onRemove,
}: FieldItemProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchText, setSearchText] = useState(field.name);
  const nameInputRef = useRef<HTMLDivElement>(null);

  // Check for duplicate field name
  const isDuplicate = useMemo(() => {
    if (!field.name.trim()) return false;
    return existingFieldNames.some(
      (name) => name.toLowerCase() === field.name.toLowerCase()
    );
  }, [field.name, existingFieldNames]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!searchText) return COMMON_FIELDS;
    const lower = searchText.toLowerCase();
    return COMMON_FIELDS.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.description.toLowerCase().includes(lower)
    );
  }, [searchText]);

  // Handle name input change
  const handleNameChange = useCallback((_: unknown, value: string) => {
    setSearchText(value);
    onUpdateName(value);
    setShowSuggestions(true);
  }, [onUpdateName]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: typeof COMMON_FIELDS[0]) => {
    setSearchText(suggestion.name);
    onUpdateName(suggestion.name);
    // Auto-set type based on suggestion
    if (suggestion.type === 'number' && !isNumericField(suggestion.name)) {
      onUpdateType('number');
    }
    setShowSuggestions(false);
  }, [onUpdateName, onUpdateType]);

  // Normalize on blur only
  const handleValueBlur = () => {
    const normalized = normalizeNumericValue(field.value || '');
    if (normalized !== field.value) {
      onUpdateValue(normalized);
    }
  };

  // Check if this is a known numeric field
  const isKnownNumeric = useMemo(() => isNumericField(field.name), [field.name]);

  // Check if this field should be validated as numeric (known OR user-selected)
  const isNumeric = useMemo(
    () => isKnownNumeric || field.type === 'number',
    [isKnownNumeric, field.type]
  );

  // Show type selector only for unknown fields
  const showTypeSelector = useMemo(
    () => field.name.trim() !== '' && !isKnownNumeric,
    [field.name, isKnownNumeric]
  );

  const hasInvalidValue = useMemo(
    () => isNumeric && !isValidNumericValue(field.value || ''),
    [isNumeric, field.value]
  );

  // Create selection for dropdown
  const typeSelection = useMemo(() => {
    const selection = new DropdownSelection();
    const selectedIndex = field.type === 'number' ? 1 : 0;
    selection.select(selectedIndex);
    return selection;
  }, [field.type]);

  const handleTypeChange = (_event: React.SyntheticEvent<HTMLElement>, item: { id: string }) => {
    onUpdateType(item.id as FieldType);
  };

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

  return (
    <div className="field-item">
      <div className={`field-item__row ${showTypeSelector ? 'field-item__row--with-type' : ''}`}>
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
              {filteredSuggestions.slice(0, 8).map((suggestion) => (
                <div
                  key={suggestion.name}
                  className="field-item__suggestion"
                  onMouseDown={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="field-item__suggestion-name">{suggestion.name}</span>
                  <span className="field-item__suggestion-desc">{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={valueErrorStyle}>
          <TextField
            value={field.value || ''}
            onChange={(_, value) => onUpdateValue(value)}
            onBlur={handleValueBlur}
            placeholder="Value (e.g. 8 or {System.IterationPath})"
            className="field-item__value"
          />
        </div>
        {showTypeSelector && (
          <Dropdown
            items={TYPE_OPTIONS}
            selection={typeSelection}
            onSelect={handleTypeChange}
            className="field-item__type"
          />
        )}
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
          This field requires a numeric value
        </div>
      )}
    </div>
  );
}
