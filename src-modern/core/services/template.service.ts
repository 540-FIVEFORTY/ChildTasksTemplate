/**
 * Service Layer - Template Service
 * Gestion des opérations sur les templates (séparation de la logique métier)
 */

import type {
  IExtensionDataManager,
  IExtensionDataService,
  IProjectPageService,
} from 'azure-devops-extension-api';
import { CommonServiceIds } from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';

import type { Template, TemplateSetup } from '@core/models';
import { SettingsUpgrade } from '@core/utils/settings-upgrade';

/**
 * Service pour la gestion des templates
 * Responsabilité : Accès aux données et transformations
 */
export class TemplateService {
  private dataManager: IExtensionDataManager | null = null;
  private projectId: string | null = null;

  private static readonly SETTINGS_KEY = 'ChildTasksTemplate';

  /**
   * Initialisation du service (lazy)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.dataManager && this.projectId) {
      return;
    }

    // Récupérer le projet courant
    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();

    if (!project) {
      throw new Error('No project defined');
    }

    this.projectId = project.id;

    // Récupérer le data manager
    const extensionContext = SDK.getExtensionContext();
    const dataService = await SDK.getService<IExtensionDataService>(
      CommonServiceIds.ExtensionDataService
    );

    this.dataManager = await dataService.getExtensionDataManager(
      extensionContext.id,
      await SDK.getAccessToken()
    );
  }

  /**
   * Récupérer la configuration complète des templates
   */
  async getTemplateSetup(): Promise<TemplateSetup> {
    await this.ensureInitialized();

    try {
      const data = await this.dataManager!.getValue<unknown>(
        TemplateService.SETTINGS_KEY,
        { scopeType: 'Default' }
      );

      // Upgrade si nécessaire (migration depuis ancienne version)
      return SettingsUpgrade.upgrade(data);
    } catch (error) {
      console.error('Failed to load template setup:', error);
      // Retourner la configuration par défaut
      return SettingsUpgrade.getDefaultSetup();
    }
  }

  /**
   * Sauvegarder la configuration des templates
   */
  async saveTemplateSetup(setup: TemplateSetup): Promise<void> {
    await this.ensureInitialized();

    // Validation avant sauvegarde
    this.validateTemplateSetup(setup);

    try {
      await this.dataManager!.setValue(
        TemplateService.SETTINGS_KEY,
        setup,
        { scopeType: 'Default' }
      );
    } catch (error) {
      console.error('Failed to save template setup:', error);
      throw new Error('Failed to save templates configuration');
    }
  }

  /**
   * Récupérer uniquement les noms des templates
   */
  async getTemplateNames(): Promise<string[]> {
    const setup = await this.getTemplateSetup();
    return setup.templates.map((t) => t.name);
  }

  /**
   * Récupérer des templates spécifiques par leurs noms
   */
  async getTemplates(names: string[]): Promise<Template[]> {
    const setup = await this.getTemplateSetup();

    return setup.templates.filter((template) =>
      names.includes(template.name)
    );
  }

  /**
   * Récupérer un template par son nom
   */
  async getTemplateByName(name: string): Promise<Template | null> {
    const setup = await this.getTemplateSetup();

    return setup.templates.find((t) => t.name === name) ?? null;
  }

  /**
   * Validation du template setup
   */
  private validateTemplateSetup(setup: TemplateSetup): void {
    if (!setup.version || typeof setup.version !== 'number') {
      throw new Error('Invalid template setup: missing or invalid version');
    }

    if (!Array.isArray(setup.templates)) {
      throw new Error('Invalid template setup: templates must be an array');
    }

    // Validation de chaque template
    for (const template of setup.templates) {
      if (!template.name || typeof template.name !== 'string') {
        throw new Error(`Invalid template: missing or invalid name`);
      }

      if (!Array.isArray(template.tasks)) {
        throw new Error(
          `Invalid template "${template.name}": tasks must be an array`
        );
      }

      // Validation de chaque task
      for (const task of template.tasks) {
        if (!task.name || typeof task.name !== 'string') {
          throw new Error(
            `Invalid task in template "${template.name}": missing or invalid name`
          );
        }

        if (!Array.isArray(task.fields)) {
          throw new Error(
            `Invalid task "${task.name}" in template "${template.name}": fields must be an array`
          );
        }

        // Validation de chaque field
        for (const field of task.fields) {
          if (!field.name || typeof field.name !== 'string') {
            throw new Error(
              `Invalid field in task "${task.name}": missing or invalid field name`
            );
          }

          // field.value peut être undefined (optionnel)
          if (field.value !== undefined && typeof field.value !== 'string') {
            throw new Error(
              `Invalid field "${field.name}" in task "${task.name}": value must be a string`
            );
          }
        }
      }
    }

    // Vérifier les noms de templates uniques
    const names = setup.templates.map((t) => t.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      throw new Error('Template names must be unique');
    }
  }
}

// Export d'une instance singleton
export const templateService = new TemplateService();
