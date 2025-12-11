/**
 * TemplateEditor - Main visual editor component
 */
import { useEffect } from 'react';
import { Button } from 'azure-devops-ui/Button';
import { ButtonGroup } from 'azure-devops-ui/ButtonGroup';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';

import { useTemplateEditorStore } from '../store/templateEditorStore';
import { TemplateItem } from './TemplateItem';
import type { TemplateSetup } from '@core/models';

import './TemplateEditor.scss';

// All possible work item types that can be created as children across different processes
// The actual valid types depend on parent type and process, but we show all options in settings
const ALL_WORK_ITEM_TYPES = [
  'Task',
  'Bug',
  'User Story',        // Agile
  'Product Backlog Item', // Scrum
  'Requirement',       // CMMI
  'Feature',
  'Issue',             // Basic
];

interface TemplateEditorProps {
  initialData: TemplateSetup | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (data: TemplateSetup) => void;
}

export function TemplateEditor({
  initialData,
  isLoading,
  isSaving,
  onSave,
}: TemplateEditorProps) {
  const {
    templateSetup,
    isDirty,
    validationErrors,
    hasErrors,
    setTemplateSetup,
    addTemplate,
    removeTemplate,
    updateTemplateName,
    addTask,
    removeTask,
    updateTaskName,
    updateTaskWorkItemType,
    addField,
    removeField,
    updateFieldName,
    updateFieldValue,
    updateFieldType,
    validate,
  } = useTemplateEditorStore();

  // Initialize store with data
  useEffect(() => {
    if (initialData) {
      setTemplateSetup(initialData);
    }
  }, [initialData, setTemplateSetup]);

  const handleSave = async () => {
    const isValid = await validate();
    if (isValid && templateSetup) {
      onSave(templateSetup);
    }
  };

  if (isLoading) {
    return (
      <div className="template-editor template-editor--loading">
        <Spinner size={SpinnerSize.large} label="Loading templates..." />
      </div>
    );
  }

  if (!templateSetup) {
    return (
      <div className="template-editor template-editor--empty">
        <p>No template configuration found.</p>
        <Button
          text="Create Configuration"
          primary
          onClick={() =>
            setTemplateSetup({
              version: 3,
              templates: [],
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="template-editor">
      <div className="template-editor__header">
        <h2>Child Tasks Template Configuration</h2>
        <p>Create and manage templates for child tasks.</p>
      </div>

      {hasErrors && (
        <MessageBar severity={MessageBarSeverity.Error}>
          Please fix the validation errors before saving.
          <ul>
            {validationErrors
              .filter((e) => e.severity === 'error')
              .map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
          </ul>
        </MessageBar>
      )}

      <div className="template-editor__templates">
        {templateSetup.templates.map((template, templateIndex) => (
          <TemplateItem
            key={templateIndex}
            template={template}
            availableWorkItemTypes={ALL_WORK_ITEM_TYPES}
            onUpdateName={(name) => updateTemplateName(templateIndex, name)}
            onRemove={() => removeTemplate(templateIndex)}
            onAddTask={() => addTask(templateIndex)}
            onRemoveTask={(taskIndex) => removeTask(templateIndex, taskIndex)}
            onUpdateTaskName={(taskIndex, name) =>
              updateTaskName(templateIndex, taskIndex, name)
            }
            onUpdateTaskWorkItemType={(taskIndex, type) =>
              updateTaskWorkItemType(templateIndex, taskIndex, type)
            }
            onAddField={(taskIndex) => addField(templateIndex, taskIndex)}
            onRemoveField={(taskIndex, fieldIndex) =>
              removeField(templateIndex, taskIndex, fieldIndex)
            }
            onUpdateFieldName={(taskIndex, fieldIndex, name) =>
              updateFieldName(templateIndex, taskIndex, fieldIndex, name)
            }
            onUpdateFieldValue={(taskIndex, fieldIndex, value) =>
              updateFieldValue(templateIndex, taskIndex, fieldIndex, value)
            }
            onUpdateFieldType={(taskIndex, fieldIndex, type) =>
              updateFieldType(templateIndex, taskIndex, fieldIndex, type)
            }
          />
        ))}

        {templateSetup.templates.length === 0 && (
          <div className="template-editor__no-templates">
            <p>No templates yet. Click "Add Template" to create one.</p>
          </div>
        )}
      </div>

      <div className="template-editor__actions">
        <Button
          text="Add Template"
          iconProps={{ iconName: 'Add' }}
          onClick={addTemplate}
        />
        <ButtonGroup>
          <Button
            text={isSaving ? 'Saving...' : 'Save'}
            primary
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            iconProps={isSaving ? { iconName: 'Sync' } : { iconName: 'Save' }}
          />
        </ButtonGroup>
      </div>

      <div className="template-editor__help">
        <h3>Available Field Variables</h3>
        <p>You can use these variables in field values to inherit from the parent work item:</p>
        <ul>
          <li><code>{'{System.IterationPath}'}</code> - Iteration path</li>
          <li><code>{'{System.AreaPath}'}</code> - Area path</li>
          <li><code>{'{System.AssignedTo}'}</code> - Assigned to</li>
          <li><code>{'{id}'}</code> - Parent work item ID</li>
        </ul>
        <h3>Common Fields</h3>
        <ul>
          <li><code>Microsoft.VSTS.Scheduling.OriginalEstimate</code> - Original estimate (hours)</li>
          <li><code>Microsoft.VSTS.Scheduling.RemainingWork</code> - Remaining work (hours)</li>
          <li><code>System.Description</code> - Description</li>
          <li><code>System.IterationPath</code> - Iteration path</li>
          <li><code>System.AreaPath</code> - Area path</li>
        </ul>
      </div>
    </div>
  );
}
