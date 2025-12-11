/**
 * FieldItem - Editable field component
 */
import { useMemo } from 'react';
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import type { Field, FieldType } from '@core/models';

interface FieldItemProps {
  field: Field;
  onUpdateName: (name: string) => void;
  onUpdateValue: (value: string) => void;
  onUpdateType: (type: FieldType) => void;
  onRemove: () => void;
}

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
  onUpdateName,
  onUpdateValue,
  onUpdateType,
  onRemove,
}: FieldItemProps) {
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

  const errorStyle: React.CSSProperties = hasInvalidValue
    ? {
        border: '2px solid #d32f2f',
        backgroundColor: '#fdecea',
        borderRadius: '4px',
      }
    : {};

  return (
    <div className="field-item">
      <div className={`field-item__row ${showTypeSelector ? 'field-item__row--with-type' : ''}`}>
        <TextField
          value={field.name}
          onChange={(_, value) => onUpdateName(value)}
          placeholder="Field name (e.g. System.Description)"
          className="field-item__name"
        />
        <div style={errorStyle}>
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
      {hasInvalidValue && (
        <div className="field-item__error">
          This field requires a numeric value
        </div>
      )}
    </div>
  );
}
