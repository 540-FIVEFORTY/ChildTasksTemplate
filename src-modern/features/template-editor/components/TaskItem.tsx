/**
 * TaskItem - Editable task component with fields
 */
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import type { Task, FieldType } from '@core/models';
import { FieldItem } from './FieldItem';

interface TaskItemProps {
  task: Task;
  taskIndex: number;
  onUpdateName: (name: string) => void;
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
  onUpdateName,
  onRemove,
  onAddField,
  onRemoveField,
  onUpdateFieldName,
  onUpdateFieldValue,
  onUpdateFieldType,
}: TaskItemProps) {
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
        <Button
          iconProps={{ iconName: 'Delete' }}
          subtle
          onClick={onRemove}
          tooltipProps={{ text: 'Remove task' }}
        />
      </div>

      <div className="task-item__fields">
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
