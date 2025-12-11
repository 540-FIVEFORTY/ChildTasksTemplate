/**
 * Composant moderne de sélection de templates
 * Utilise React 18 + Hooks + Azure DevOps UI
 */

import { useCallback } from 'react';
import { Button } from 'azure-devops-ui/Button';
import { ButtonGroup } from 'azure-devops-ui/ButtonGroup';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Observer } from 'azure-devops-ui/Observer';
import { ZeroData } from 'azure-devops-ui/ZeroData';

import { useTemplateSelection } from '../hooks/useTemplateSelection';
import { useAzureDialog } from '@shared/hooks/useAzureDialog';
import { useTaskCreation } from '@features/task-creation/hooks/useTaskCreation';
import { TemplateList } from './TemplateList';

import type { IChooseTemplatePanelResult } from '../types';

import './TemplateSelectorPanel.scss';

/**
 * Panel de sélection de templates
 * Architecture moderne : Composant fonctionnel avec hooks
 */
export function TemplateSelectorPanel() {
  const dialog = useAzureDialog<IChooseTemplatePanelResult>();

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

  // Handler pour la soumission
  const handleSubmit = useCallback(async () => {
    if (!hasSelection || !dialog.context) {
      return;
    }

    try {
      await createTasks({
        context: dialog.context,
        templateNames: selectedTemplateNames,
      });

      // Fermer le dialog avec succès
      dialog.close({
        names: selectedTemplateNames,
        context: dialog.context,
        success: true,
      });
    } catch (err) {
      console.error('Failed to create tasks:', err);
      // Ne pas fermer le dialog en cas d'erreur
      // L'utilisateur peut réessayer
    }
  }, [hasSelection, dialog, selectedTemplateNames, createTasks]);

  // Handler pour l'annulation
  const handleCancel = useCallback(() => {
    dialog.close({
      names: [],
      context: dialog.context,
      success: false,
    });
  }, [dialog]);

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
        <TemplateList
          templates={templates}
          onToggle={toggleTemplate}
          isSelected={isSelected}
        />
      </div>

      <ButtonGroup className="template-selector-panel__actions">
        <Button text="Cancel" onClick={handleCancel} disabled={isCreating} />

        <Observer disabled={!hasSelection || isCreating}>
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
