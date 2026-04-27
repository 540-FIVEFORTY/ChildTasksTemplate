/**
 * Settings Page - Visual Template Editor with JSON toggle
 */
import { useEffect, useState, useCallback } from 'react';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Toggle } from 'azure-devops-ui/Toggle';
import { Button } from 'azure-devops-ui/Button';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';

import { useAzureSDK } from '../shared/hooks';
import { templateService } from '../core/services';
import { TemplateEditor } from '../features/template-editor/components';
import type { TemplateSetup } from '../core/models';

import './SettingsPage.scss';

export function SettingsPage() {
  const { isReady } = useAzureSDK();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<TemplateSetup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    severity: MessageBarSeverity;
    text: string;
  } | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadSetup();
    }
  }, [isReady]);

  // Sync JSON text when switching modes or when data changes
  useEffect(() => {
    if (initialData) {
      setJsonText(JSON.stringify(initialData, null, 2));
    }
  }, [initialData]);

  const loadSetup = async () => {
    try {
      setLoadError(null);
      const data = await templateService.getTemplateSetup();
      setInitialData(data);
    } catch (error) {
      console.error('Failed to load setup:', error);
      setLoadError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVisual = async (data: TemplateSetup) => {
    try {
      setIsSaving(true);
      setSaveStatus(null);
      await templateService.saveTemplateSetup(data);
      setInitialData(data);
      setSaveStatus({
        severity: MessageBarSeverity.Success,
        text: 'Template saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus({
        severity: MessageBarSeverity.Error,
        text: 'Failed to save template: ' + (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText) as TemplateSetup;

      // Basic validation
      if (typeof parsed.version !== 'number') {
        throw new Error('Missing or invalid "version" field');
      }
      if (!Array.isArray(parsed.templates)) {
        throw new Error('Missing or invalid "templates" array');
      }

      setIsSaving(true);
      setSaveStatus(null);
      await templateService.saveTemplateSetup(parsed);
      setInitialData(parsed);
      setSaveStatus({
        severity: MessageBarSeverity.Success,
        text: 'Template saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save:', error);
      if (error instanceof SyntaxError) {
        setJsonError('Invalid JSON syntax: ' + error.message);
      } else {
        const message = 'Failed to save: ' + (error as Error).message;
        setJsonError(message);
        setSaveStatus({
          severity: MessageBarSeverity.Error,
          text: message,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeToggle = useCallback((_event: React.MouseEvent | React.KeyboardEvent, checked: boolean) => {
    if (checked && initialData) {
      // Switching to JSON mode - update JSON text from current data
      setJsonText(JSON.stringify(initialData, null, 2));
    } else if (!checked) {
      // Switching to visual mode - try to parse JSON
      try {
        const parsed = JSON.parse(jsonText) as TemplateSetup;
        setInitialData(parsed);
        setJsonError(null);
      } catch (error) {
        // If JSON is invalid, show error and stay in JSON mode
        setJsonError('Cannot switch to visual mode: Invalid JSON - ' + (error as Error).message);
        return;
      }
    }
    setJsonMode(checked);
  }, [initialData, jsonText]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      alert('JSON copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (error) {
      setJsonError('Cannot format: Invalid JSON - ' + (error as Error).message);
    }
  };

  if (!isReady) {
    return (
      <div className="settings-page settings-page--loading">
        <Spinner size={SpinnerSize.large} label="Initializing..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="settings-page">
        <MessageBar severity={MessageBarSeverity.Error}>
          Failed to load template configuration: {loadError}
        </MessageBar>
        <div className="settings-page__actions">
          <Button text="Retry" primary onClick={loadSetup} />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <div className="settings-page__title">
          <h2>Child Tasks Template Configuration</h2>
          <p>Create and manage templates for child tasks.</p>
        </div>
        <div className="settings-page__toggle">
          <span className={!jsonMode ? 'active' : ''}>Visual</span>
          <Toggle
            checked={jsonMode}
            onChange={handleModeToggle}
          />
          <span className={jsonMode ? 'active' : ''}>JSON</span>
        </div>
      </div>

      {saveStatus && (
        <MessageBar
          severity={saveStatus.severity}
          className="settings-page__status"
          onDismiss={() => setSaveStatus(null)}
        >
          {saveStatus.text}
        </MessageBar>
      )}

      {jsonMode ? (
        <div className="settings-page__json-editor">
          {jsonError && (
            <MessageBar severity={MessageBarSeverity.Error} className="settings-page__error">
              {jsonError}
            </MessageBar>
          )}

          <div className="settings-page__json-toolbar">
            <Button
              text="Copy JSON"
              iconProps={{ iconName: 'Copy' }}
              subtle
              onClick={handleCopyJson}
            />
            <Button
              text="Format"
              iconProps={{ iconName: 'Code' }}
              subtle
              onClick={handleFormatJson}
            />
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            className="settings-page__textarea"
            spellCheck={false}
          />

          <div className="settings-page__actions">
            <Button
              text={isSaving ? 'Saving...' : 'Save JSON'}
              primary
              onClick={handleSaveJson}
              disabled={isSaving}
              iconProps={isSaving ? { iconName: 'Sync' } : { iconName: 'Save' }}
            />
          </div>

          <div className="settings-page__json-help">
            <h3>JSON Structure</h3>
            <pre>{`{
  "version": 3,
  "templates": [
    {
      "name": "Template Name",
      "tasks": [
        {
          "name": "Task Name",
          "fields": [
            { "name": "FieldName", "value": "Value" }
          ]
        }
      ]
    }
  ]
}`}</pre>
          </div>
        </div>
      ) : (
        <TemplateEditor
          initialData={initialData}
          isLoading={isLoading}
          isSaving={isSaving}
          onSave={handleSaveVisual}
        />
      )}
    </div>
  );
}
