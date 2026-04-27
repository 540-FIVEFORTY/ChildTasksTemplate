/**
 * Service Layer - Template Service
 * Gestion des opérations sur les templates (séparation de la logique métier)
 */

import type {
  IExtensionDataManager,
  IExtensionDataService,
  IProjectPageService,
} from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';

import { ServiceIds } from '@core/constants/service-ids';

import type { Template, TemplateSetup } from '@core/models';
import { SettingsUpgrade } from '@core/utils/settings-upgrade';

/**
 * Service pour la gestion des templates
 * Responsabilité : Accès aux données et transformations
 */
export class TemplateService {
  private dataManager: IExtensionDataManager | null = null;
  private projectId: string | null = null;

  private static readonly SETTINGS_KEY_PREFIX = 'ChildTasksTemplate';
  private static readonly LEGACY_SETTINGS_KEY_PREFIX =
    'fiveforty-child-tasks-template';

  /**
   * Get the project-specific settings key
   */
  private getSettingsKey(): string {
    return `${TemplateService.SETTINGS_KEY_PREFIX}_${this.projectId}`;
  }

  /**
   * Get the legacy project-specific settings key used by the old implementation.
   */
  private getLegacySettingsKey(): string {
    return `${TemplateService.LEGACY_SETTINGS_KEY_PREFIX}-${this.projectId}`;
  }

  /**
   * Initialisation du service (lazy)
   */
  private async ensureInitialized(options: { refreshDataManager?: boolean } = {}): Promise<void> {
    if (this.dataManager && this.projectId && !options.refreshDataManager) {
      return;
    }

    if (!this.projectId) {
      // Récupérer le projet courant
      const projectService = await SDK.getService<IProjectPageService>(
        ServiceIds.ProjectPageService
      );
      const project = await projectService.getProject();

      if (!project) {
        throw new Error('No project defined');
      }

      this.projectId = project.id;
    }

    // Récupérer le data manager
    const extensionContext = SDK.getExtensionContext();
    const extensionId =
      (extensionContext as { id?: string; extensionId?: string }).id ??
      (extensionContext as { id?: string; extensionId?: string }).extensionId;

    if (!extensionId) {
      throw new Error('No extension ID defined');
    }

    const dataService = await SDK.getService<IExtensionDataService>(
      ServiceIds.ExtensionDataService
    );

    this.dataManager = await dataService.getExtensionDataManager(
      extensionId,
      await SDK.getAccessToken()
    );
  }

  /**
   * Récupérer la configuration complète des templates
   */
  async getTemplateSetup(): Promise<TemplateSetup> {
    await this.ensureInitialized();

    try {
      const currentKey = this.getSettingsKey();
      console.log(
        `[TemplateService] Loading templates for project ${this.projectId} (key: ${currentKey})`
      );

      const data = await this.dataManager!.getValue<unknown>(currentKey, {
        scopeType: 'Default',
      });

      if (TemplateService.hasStoredValue(data)) {
        const setup = SettingsUpgrade.upgrade(data);
        console.log(
          `[TemplateService] Loaded ${setup.templates.length} templates from current key`
        );
        return setup;
      }

      const legacyKey = this.getLegacySettingsKey();
      const legacyData = await this.dataManager!.getValue<unknown>(legacyKey, {
        scopeType: 'Default',
      });

      if (TemplateService.hasStoredValue(legacyData)) {
        const setup = SettingsUpgrade.upgrade(legacyData);
        console.log(
          `[TemplateService] Loaded ${setup.templates.length} templates from legacy key`
        );
        await this.migrateLegacySetup(setup);
        return setup;
      }

      return SettingsUpgrade.getDefaultSetup();
    } catch (error) {
      console.error('Failed to load template setup:', error);
      throw new Error('Failed to load templates configuration');
    }
  }

  /**
   * Sauvegarder la configuration des templates
   */
  async saveTemplateSetup(setup: TemplateSetup): Promise<void> {
    await this.ensureInitialized({ refreshDataManager: true });

    // Validation avant sauvegarde
    this.validateTemplateSetup(setup);

    try {
      await this.dataManager!.setValue(
        this.getSettingsKey(),
        setup,
        { scopeType: 'Default' }
      );
      console.log(`[TemplateService] Saved templates for project ${this.projectId}`);
    } catch (error) {
      console.error('Failed to save template setup:', error);
      throw new Error('Failed to save templates configuration');
    }
  }

  private async migrateLegacySetup(setup: TemplateSetup): Promise<void> {
    try {
      await this.dataManager!.setValue(this.getSettingsKey(), setup, {
        scopeType: 'Default',
      });
      console.log(
        `[TemplateService] Migrated templates to current key for project ${this.projectId}`
      );
    } catch (error) {
      console.warn(
        '[TemplateService] Failed to migrate legacy templates to current key:',
        error
      );
    }
  }

  private static hasStoredValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
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
