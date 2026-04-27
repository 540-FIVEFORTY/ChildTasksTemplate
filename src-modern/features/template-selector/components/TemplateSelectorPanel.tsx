/**
 * Composant moderne de sélection de templates
 * Utilise React 18 + Hooks + Azure DevOps UI
 */

import { useCallback, useState } from 'react';
import { Button } from 'azure-devops-ui/Button';
import { ButtonGroup } from 'azure-devops-ui/ButtonGroup';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Observer } from 'azure-devops-ui/Observer';
import { ZeroData } from 'azure-devops-ui/ZeroData';

import { useTemplateSelection } from '../hooks/useTemplateSelection';
import { useAzureDialog } from '@shared/hooks/useAzureDialog';
import { useTaskCreation } from '@features/task-creation/hooks/useTaskCreation';
import { TemplateList } from './TemplateList';

import type { IChooseTemplatePanelResult } from '../types';
import type { ChildTaskExecutionResult } from '@core/services/childTasks.service';

import './TemplateSelectorPanel.scss';

/**
 * Panel de sélection de templates
 * Architecture moderne : Composant fonctionnel avec hooks
 */
export function TemplateSelectorPanel() {
  const dialog = useAzureDialog<IChooseTemplatePanelResult>();
  const [submissionResult, setSubmissionResult] =
    useState<ChildTaskExecutionResult | null>(null);

  const {
    templates,
    selectedTemplateNames,
    isLoading: isLoadingTemplates,
    error,
    toggleTemplate,
    isSelected,
    hasSelection,
    selectionCount,
  } = useTemplateSelection();

  // Wait for SDK to be ready
  const isLoading = !dialog.isReady || isLoadingTemplates;

  const { createTasks, isCreating } = useTaskCreation();

  const handleToggleTemplate = useCallback(
    (name: string) => {
      setSubmissionResult(null);
      toggleTemplate(name);
    },
    [toggleTemplate]
  );

  // Handler pour la soumission
  const handleSubmit = useCallback(async () => {
    if (!hasSelection || !dialog.context) {
      return;
    }

    try {
      setSubmissionResult(null);
      const result = await createTasks({
        context: dialog.context,
        templateNames: selectedTemplateNames,
      });
      setSubmissionResult(result);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      setSubmissionResult({
        status: 'failed',
        attemptedCount: 0,
        createdCount: 0,
        failedCount: 0,
        createdWorkItemIds: [],
        items: [],
        errorMessage: (err as Error).message,
      });
    }
  }, [hasSelection, dialog.context, selectedTemplateNames, createTasks]);

  // Handler pour l'annulation
  const handleCancel = useCallback(() => {
    dialog.close({
      names: selectedTemplateNames,
      context: dialog.context,
      success: submissionResult?.status === 'success',
      result: submissionResult ?? undefined,
    });
  }, [dialog, selectedTemplateNames, submissionResult]);

  const resultSeverity = useCallback((result: ChildTaskExecutionResult) => {
    if (result.status === 'success') {
      return MessageBarSeverity.Success;
    }

    if (result.status === 'partial') {
      return MessageBarSeverity.Warning;
    }

    return MessageBarSeverity.Error;
  }, []);

  const resultSummary = useCallback((result: ChildTaskExecutionResult) => {
    if (result.status === 'success') {
      return `Created ${result.createdCount} child task${
        result.createdCount === 1 ? '' : 's'
      } successfully.`;
    }

    if (result.status === 'partial') {
      return `Created ${result.createdCount} child task${
        result.createdCount === 1 ? '' : 's'
      } and failed to create ${result.failedCount}.`;
    }

    return (
      result.errorMessage ??
      `Failed to create child tasks for the selected templates.`
    );
  }, []);

  const failedItems = submissionResult?.items.filter(
    (item) => item.status === 'failed'
  );

  // État de chargement
  if (isLoading) {
    return (
      <div className="template-selector-panel template-selector-panel--loading">
        <Spinner size={SpinnerSize.large} label="Loading templates..." />
      </div>
    );
  }

  // Gestion d'erreur
  if (error) {
    return (
      <div className="template-selector-panel template-selector-panel--error">
        <ZeroData
          primaryText="Failed to load templates"
          secondaryText={error.message}
          imagePath="https://cdn.vsassets.io/ext/ms.vss-work-web/common-content/error.png"
          imageAltText="Error"
        />
        <ButtonGroup className="button-bar">
          <Button text="Close" onClick={handleCancel} />
        </ButtonGroup>
      </div>
    );
  }

  // Aucun template disponible
  if (templates.length === 0) {
    return (
      <div className="template-selector-panel template-selector-panel--empty">
        <ZeroData
          primaryText="No templates configured"
          secondaryText="Please configure templates in project settings"
          imagePath="https://cdn.vsassets.io/ext/ms.vss-work-web/common-content/empty.png"
          imageAltText="No templates"
        />
        <ButtonGroup className="button-bar">
          <Button text="Close" onClick={handleCancel} />
        </ButtonGroup>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="template-selector-panel">
      <div className="template-selector-panel__header">
        <h2 className="template-selector-panel__title">
          Choose templates to apply
        </h2>
        <p className="template-selector-panel__subtitle">
          {selectionCount} template{selectionCount !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="template-selector-panel__content">
        {submissionResult && (
          <MessageBar
            severity={resultSeverity(submissionResult)}
            className="template-selector-panel__result"
          >
            <div>{resultSummary(submissionResult)}</div>
            {submissionResult.createdWorkItemIds.length > 0 && (
              <div className="template-selector-panel__result-detail">
                Created work item IDs: {submissionResult.createdWorkItemIds.join(', ')}
              </div>
            )}
            {failedItems && failedItems.length > 0 && (
              <ul className="template-selector-panel__result-list">
                {failedItems.map((item, index) => (
                  <li key={`${item.templateName}-${item.taskName}-${index}`}>
                    {item.templateName} / {item.taskName} ({item.workItemType}):{' '}
                    {item.errorMessage}
                  </li>
                ))}
              </ul>
            )}
          </MessageBar>
        )}

        <TemplateList
          templates={templates}
          onToggle={handleToggleTemplate}
          isSelected={isSelected}
        />
      </div>

      <ButtonGroup className="template-selector-panel__actions">
        <Button
          text={submissionResult ? 'Close' : 'Cancel'}
          onClick={handleCancel}
          disabled={isCreating}
        />

        <Observer
          disabled={
            !hasSelection ||
            isCreating ||
            submissionResult?.status === 'success' ||
            submissionResult?.status === 'partial'
          }
        >
          {(props) => (
            <Button
              {...props}
              primary
              text={isCreating ? 'Creating tasks...' : 'Create tasks'}
              onClick={handleSubmit}
              iconProps={
                isCreating ? { iconName: 'Spinner', className: 'rotating' } : undefined
              }
            />
          )}
        </Observer>
      </ButtonGroup>
    </div>
  );
}
