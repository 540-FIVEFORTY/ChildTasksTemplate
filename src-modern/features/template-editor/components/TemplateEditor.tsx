/**
 * TemplateEditor - Main visual editor component
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'azure-devops-ui/Button';
import { ButtonGroup } from 'azure-devops-ui/ButtonGroup';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';

import { useTemplateEditorStore } from '../store/templateEditorStore';
import { TemplateItem } from './TemplateItem';
import type { TemplateSetup } from '@core/models';
import { parseTemplateImport } from '@core/utils';
import { workItemMetadataService } from '@core/services';

import './TemplateEditor.scss';

const FALLBACK_WORK_ITEM_TYPES = [
  'Task',
  'Bug',
  'User Story',
  'Product Backlog Item',
  'Requirement',
  'Feature',
  'Issue',
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
    importTemplates,
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const {
    data: projectWorkItemTypes = FALLBACK_WORK_ITEM_TYPES,
    error: workItemTypesError,
  } = useQuery({
    queryKey: ['project-work-item-types'],
    queryFn: async () => {
      const types = await workItemMetadataService.getWorkItemTypes();
      return types.map((type) => type.name);
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const handleImportTemplates = () => {
    try {
      const templates = parseTemplateImport(importText);
      const result = importTemplates(templates);
      setImportError(null);
      setImportSuccess(
        `Imported ${result.importedNames.length} template${
          result.importedNames.length === 1 ? '' : 's'
        }: ${result.importedNames.join(', ')}`
      );
      setImportText('');
      setIsImportOpen(false);
    } catch (error) {
      setImportSuccess(null);
      setImportError((error as Error).message);
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

      {importSuccess && (
        <MessageBar severity={MessageBarSeverity.Success}>
          {importSuccess}
        </MessageBar>
      )}

      {workItemTypesError && (
        <MessageBar severity={MessageBarSeverity.Warning}>
          Project work item metadata could not be loaded. The editor is using a
          fallback work item type list, and field suggestions may be incomplete.
        </MessageBar>
      )}

      <div className="template-editor__templates">
        {templateSetup.templates.map((template, templateIndex) => (
          <TemplateItem
            key={templateIndex}
            template={template}
            availableWorkItemTypes={projectWorkItemTypes}
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
        <ButtonGroup>
          <Button
            text="Add Template"
            iconProps={{ iconName: 'Add' }}
            onClick={addTemplate}
          />
          <Button
            text="Add Template via JSON"
            iconProps={{ iconName: 'Paste' }}
            onClick={() => {
              setIsImportOpen((current) => !current);
              setImportError(null);
              setImportSuccess(null);
            }}
          />
        </ButtonGroup>
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

      {isImportOpen && (
        <div className="template-editor__import-panel">
          <h3>Add Template via JSON</h3>
          <p>
            Paste a single template object or a full template setup. Imported
            templates are merged into the current project configuration.
          </p>

          {importError && (
            <MessageBar severity={MessageBarSeverity.Error}>
              {importError}
            </MessageBar>
          )}

          <textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError(null);
            }}
            className="template-editor__import-textarea"
            placeholder={`{
  "name": "Imported Template",
  "tasks": [
    {
      "name": "Task Name",
      "fields": [{ "name": "System.Title", "value": "Example" }]
    }
  ]
}`}
            spellCheck={false}
          />

          <div className="template-editor__import-actions">
            <Button
              text="Cancel"
              onClick={() => {
                setIsImportOpen(false);
                setImportError(null);
              }}
            />
            <Button
              text="Import Template"
              primary
              onClick={handleImportTemplates}
            />
          </div>
        </div>
      )}

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
