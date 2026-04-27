import type { Task } from '../models/Task';
import type { Template } from '../models/Template';
import type { TemplateSetup } from '../models/TemplateSetup';
import sample from './templateSetupSample.json';

export class SettingsUpgrade {
  private static currentVersion = 3;

  public static upgradeToCurrent(obj: unknown): TemplateSetup {
    const parsed = this.parseStoredValue(obj);

    if (!parsed) {
      return this.getDefaultSetup();
    }

    if (this.hasTemplates(parsed)) {
      return this.normalizeSetup(
        parsed.templates,
        parsed.version as number | undefined
      );
    }

    if (this.hasLegacyTasks(parsed)) {
      const template: Template = {
        name: 'default',
        tasks: parsed.tasks.map((task) => this.normalizeTask(task)),
      };

      return {
        version: this.currentVersion,
        templates: [template],
      };
    }

    return this.getDefaultSetup();
  }

  public static upgrade(obj: unknown): TemplateSetup {
    return this.upgradeToCurrent(obj);
  }

  public static getDefaultSetup(): TemplateSetup {
    return this.cloneSetup(sample as TemplateSetup);
  }

  private static parseStoredValue(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      throw new Error('Invalid template setup JSON');
    }
  }

  private static hasTemplates(
    value: unknown
  ): value is { version?: number; templates: Template[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as { templates?: unknown }).templates)
    );
  }

  private static hasLegacyTasks(
    value: unknown
  ): value is { version?: number; tasks: Task[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as { tasks?: unknown }).tasks)
    );
  }

  private static normalizeSetup(
    templates: Template[],
    version?: number
  ): TemplateSetup {
    return {
      version:
        version && version >= this.currentVersion
          ? version
          : this.currentVersion,
      templates: templates.map((template) => this.normalizeTemplate(template)),
    };
  }

  private static normalizeTemplate(template: Template): Template {
    return {
      name: template.name ?? '',
      tasks: Array.isArray(template.tasks)
        ? template.tasks.map((task) => this.normalizeTask(task))
        : [],
    };
  }

  private static normalizeTask(task: Task): Task {
    return {
      name: task.name ?? '',
      workItemType:
        typeof task.workItemType === 'string' && task.workItemType.trim()
          ? task.workItemType
          : 'Task',
      fields: Array.isArray(task.fields)
        ? task.fields.map((field) => ({
            name: field.name ?? '',
            value:
              field.value === undefined || field.value === null
                ? undefined
                : String(field.value),
            type: field.type,
          }))
        : [],
    };
  }

  private static cloneSetup(setup: TemplateSetup): TemplateSetup {
    return JSON.parse(JSON.stringify(setup)) as TemplateSetup;
  }
}
