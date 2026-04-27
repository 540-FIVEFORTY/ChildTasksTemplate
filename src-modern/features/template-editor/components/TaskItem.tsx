/**
 * TaskItem - Editable task component with fields
 */
import { useQuery } from '@tanstack/react-query';
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import type { IListBoxItem } from 'azure-devops-ui/ListBox';
import { useMemo, type CSSProperties } from 'react';
import type { Task, FieldType } from '@core/models';
import { FieldItem } from './FieldItem';
import {
  workItemMetadataService,
  type WorkItemFieldInfo,
} from '@core/services';

interface TaskItemProps {
  task: Task;
  taskIndex: number;
  availableWorkItemTypes: string[];
  onUpdateName: (name: string) => void;
  onUpdateWorkItemType: (workItemType: string) => void;
  onRemove: () => void;
  onAddField: () => void;
  onRemoveField: (fieldIndex: number) => void;
  onUpdateFieldName: (fieldIndex: number, name: string) => void;
  onUpdateFieldValue: (fieldIndex: number, value: string) => void;
  onUpdateFieldType: (fieldIndex: number, type: FieldType) => void;
}

export function TaskItem({
  task,
  taskIndex,
  availableWorkItemTypes,
  onUpdateName,
  onUpdateWorkItemType,
  onRemove,
  onAddField,
  onRemoveField,
  onUpdateFieldName,
  onUpdateFieldValue,
  onUpdateFieldType,
}: TaskItemProps) {
  const currentType = task.workItemType || 'Task';
  const { data: availableFields = [] } = useQuery<WorkItemFieldInfo[]>({
    queryKey: ['work-item-fields', currentType],
    queryFn: () => workItemMetadataService.getFieldsForWorkItemType(currentType),
    staleTime: 5 * 60 * 1000,
  });

  // Create dropdown items from available work item types
  const workItemTypeItems: IListBoxItem[] = useMemo(
    () =>
      availableWorkItemTypes.map((type) => ({
        id: type,
        text: type,
      })),
    [availableWorkItemTypes]
  );

  // Create selection object for dropdown
  const workItemTypeSelection = useMemo(() => {
    const selection = new DropdownSelection();
    const index = availableWorkItemTypes.indexOf(currentType);
    if (index >= 0) {
      selection.select(index);
    }
    return selection;
  }, [currentType, availableWorkItemTypes]);

  const fieldNameColumnWidth = useMemo(() => {
    const longestReferenceName = availableFields.reduce(
      (max, field) => Math.max(max, field.referenceName.length),
      24
    );

    return `${Math.min(Math.max(longestReferenceName + 8, 32), 80)}ch`;
  }, [availableFields]);

  const fieldLayoutStyle = useMemo(
    () =>
      ({
        '--field-name-column-width': `minmax(320px, ${fieldNameColumnWidth})`,
        '--field-name-suggestions-width': `min(${Math.min(
          Math.max(parseInt(fieldNameColumnWidth, 10) + 16, 56),
          112
        )}ch, calc(100vw - 80px))`,
      }) as CSSProperties,
    [fieldNameColumnWidth]
  );

  const handleWorkItemTypeSelect = (
    _event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    onUpdateWorkItemType(item.id as string);
  };

  return (
    <div className="task-item">
      <div className="task-item__header">
        <span className="task-item__index">{taskIndex + 1}.</span>
        <TextField
          value={task.name}
          onChange={(_, value) => onUpdateName(value)}
          placeholder="Task name"
          className="task-item__name"
        />
        <Dropdown
          items={workItemTypeItems}
          selection={workItemTypeSelection}
          onSelect={handleWorkItemTypeSelect}
          className="task-item__type"
          placeholder="Work Item Type"
        />
        <Button
          iconProps={{ iconName: 'Delete' }}
          subtle
          onClick={onRemove}
          tooltipProps={{ text: 'Remove task' }}
        />
      </div>

      <div className="task-item__fields" style={fieldLayoutStyle}>
        {task.fields.length > 0 && (
          <div className="task-item__fields-header">
            <span className="field-label">Field Name</span>
            <span className="field-label">Value</span>
          </div>
        )}

        {task.fields.map((field, fieldIndex) => {
          // Get names of other fields (excluding current one) for duplicate check
          const otherFieldNames = task.fields
            .filter((_, idx) => idx !== fieldIndex)
            .map((f) => f.name)
            .filter((name) => name.trim() !== '');

          return (
            <FieldItem
              key={fieldIndex}
              field={field}
              availableFields={availableFields}
              existingFieldNames={otherFieldNames}
              onUpdateName={(name) => onUpdateFieldName(fieldIndex, name)}
              onUpdateValue={(value) => onUpdateFieldValue(fieldIndex, value)}
              onUpdateType={(type) => onUpdateFieldType(fieldIndex, type)}
              onRemove={() => onRemoveField(fieldIndex)}
            />
          );
        })}

        <Button
          text="Add Field"
          iconProps={{ iconName: 'Add' }}
          subtle
          onClick={onAddField}
          className="task-item__add-field"
        />
      </div>
    </div>
  );
}
