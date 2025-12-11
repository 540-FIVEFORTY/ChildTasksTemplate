/**
 * TemplateItem - Editable template component with tasks
 */
import { useState } from 'react';
import { TextField } from 'azure-devops-ui/TextField';
import { Button } from 'azure-devops-ui/Button';
import { Card } from 'azure-devops-ui/Card';
import type { Template, FieldType } from '@core/models';
import { TaskItem } from './TaskItem';

interface TemplateItemProps {
  template: Template;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  onAddTask: () => void;
  onRemoveTask: (taskIndex: number) => void;
  onUpdateTaskName: (taskIndex: number, name: string) => void;
  onAddField: (taskIndex: number) => void;
  onRemoveField: (taskIndex: number, fieldIndex: number) => void;
  onUpdateFieldName: (taskIndex: number, fieldIndex: number, name: string) => void;
  onUpdateFieldValue: (taskIndex: number, fieldIndex: number, value: string) => void;
  onUpdateFieldType: (taskIndex: number, fieldIndex: number, type: FieldType) => void;
}

export function TemplateItem({
  template,
  onUpdateName,
  onRemove,
  onAddTask,
  onRemoveTask,
  onUpdateTaskName,
  onAddField,
  onRemoveField,
  onUpdateFieldName,
  onUpdateFieldValue,
  onUpdateFieldType,
}: TemplateItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="template-item">
      <div className="template-item__header">
        <Button
          iconProps={{ iconName: isExpanded ? 'ChevronDown' : 'ChevronRight' }}
          subtle
          onClick={() => setIsExpanded(!isExpanded)}
        />
        <TextField
          value={template.name}
          onChange={(_, value) => onUpdateName(value)}
          placeholder="Template name"
          className="template-item__name"
        />
        <span className="template-item__count">
          {template.tasks.length} task{template.tasks.length !== 1 ? 's' : ''}
        </span>
        <Button
          iconProps={{ iconName: 'Delete' }}
          subtle
          danger
          onClick={onRemove}
          tooltipProps={{ text: 'Remove template' }}
        />
      </div>

      {isExpanded && (
        <div className="template-item__content">
          <div className="template-item__tasks">
            {template.tasks.map((task, taskIndex) => (
              <TaskItem
                key={taskIndex}
                task={task}
                taskIndex={taskIndex}
                onUpdateName={(name) => onUpdateTaskName(taskIndex, name)}
                onRemove={() => onRemoveTask(taskIndex)}
                onAddField={() => onAddField(taskIndex)}
                onRemoveField={(fieldIndex) => onRemoveField(taskIndex, fieldIndex)}
                onUpdateFieldName={(fieldIndex, name) =>
                  onUpdateFieldName(taskIndex, fieldIndex, name)
                }
                onUpdateFieldValue={(fieldIndex, value) =>
                  onUpdateFieldValue(taskIndex, fieldIndex, value)
                }
                onUpdateFieldType={(fieldIndex, type) =>
                  onUpdateFieldType(taskIndex, fieldIndex, type)
                }
              />
            ))}
          </div>

          <Button
            text="Add Task"
            iconProps={{ iconName: 'Add' }}
            onClick={onAddTask}
            className="template-item__add-task"
          />
        </div>
      )}
    </Card>
  );
}
