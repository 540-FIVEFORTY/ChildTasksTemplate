import type { Task } from '../models/Task';
import type { Template } from '../models/Template';
import type { TemplateSetup } from '../models/TemplateSetup';
import sample from './templateSetupSample.json';

export class SettingsUpgrade {
  private static currentVersion = 2;

  public static upgradeToCurrent(obj: any): TemplateSetup {
    if (!obj) {
      return sample as TemplateSetup;
    }
    const version = obj.version as number;
    if (version === undefined || version < SettingsUpgrade.currentVersion) {
      const tasks: Task[] = obj.tasks;
      const template: Template = { name: 'default', tasks: tasks };
      const setup: TemplateSetup = {
        version: this.currentVersion,
        templates: [template],
      };
      return setup;
    }
    return obj as TemplateSetup;
  }

  public static upgrade(obj: any): TemplateSetup {
    return this.upgradeToCurrent(obj);
  }

  public static getDefaultSetup(): TemplateSetup {
    return sample as TemplateSetup;
  }
}
