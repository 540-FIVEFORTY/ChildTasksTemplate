/**
 * Tests for SettingsUpgrade utility
 */
import { describe, it, expect } from 'vitest';
import { SettingsUpgrade } from './settings-upgrade';
import type { Task } from '../models/Task';
import type { TemplateSetup } from '../models/TemplateSetup';

describe('SettingsUpgrade', () => {
  describe('upgradeToCurrent', () => {
    it('should return default setup when input is null', () => {
      const result = SettingsUpgrade.upgradeToCurrent(null);

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should return default setup when input is undefined', () => {
      const result = SettingsUpgrade.upgradeToCurrent(undefined);

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
    });

    it('should upgrade v1 format (tasks array) to v2 format', () => {
      const v1Config = {
        tasks: [
          {
            name: 'Task 1',
            fields: [{ name: 'System.Title', value: 'Test' }],
          },
        ],
      };

      const result = SettingsUpgrade.upgradeToCurrent(v1Config);

      expect(result.version).toBe(2);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('default');
      expect(result.templates[0].tasks).toEqual(v1Config.tasks);
    });

    it('should upgrade config with version < 2', () => {
      const oldConfig = {
        version: 1,
        tasks: [
          {
            name: 'Design Task',
            fields: [{ name: 'System.Title', value: '{System.Title} Design' }],
          },
          {
            name: 'Dev Task',
            fields: [{ name: 'System.Title', value: '{System.Title} Dev' }],
          },
        ],
      };

      const result = SettingsUpgrade.upgradeToCurrent(oldConfig);

      expect(result.version).toBe(2);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('default');
      expect(result.templates[0].tasks).toHaveLength(2);
    });

    it('should return v2 config unchanged', () => {
      const v2Config: TemplateSetup = {
        version: 2,
        templates: [
          {
            name: 'template1',
            tasks: [
              {
                name: 'Task A',
                fields: [{ name: 'System.Title', value: 'A' }],
              },
            ],
          },
          {
            name: 'template2',
            tasks: [
              {
                name: 'Task B',
                fields: [{ name: 'System.Title', value: 'B' }],
              },
            ],
          },
        ],
      };

      const result = SettingsUpgrade.upgradeToCurrent(v2Config);

      expect(result).toEqual(v2Config);
      expect(result.templates).toHaveLength(2);
    });
  });

  describe('upgrade', () => {
    it('should be an alias for upgradeToCurrent', () => {
      const oldConfig = {
        tasks: [{ name: 'Task', fields: [] }],
      };

      const result1 = SettingsUpgrade.upgrade(oldConfig);
      const result2 = SettingsUpgrade.upgradeToCurrent(oldConfig);

      expect(result1).toEqual(result2);
    });
  });

  describe('getDefaultSetup', () => {
    it('should return a valid default setup', () => {
      const result = SettingsUpgrade.getDefaultSetup();

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
      expect(result.templates).toBeDefined();
      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('should return setup with default template containing tasks', () => {
      const result = SettingsUpgrade.getDefaultSetup();
      const defaultTemplate = result.templates.find((t) => t.name === 'default');

      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate!.tasks.length).toBeGreaterThan(0);
    });

    it('should have tasks with proper structure', () => {
      const result = SettingsUpgrade.getDefaultSetup();
      const firstTask = result.templates[0].tasks[0];

      expect(firstTask.name).toBeDefined();
      expect(typeof firstTask.name).toBe('string');
      expect(firstTask.fields).toBeDefined();
      expect(Array.isArray(firstTask.fields)).toBe(true);
    });

    it('should have fields with name and value properties', () => {
      const result = SettingsUpgrade.getDefaultSetup();
      const firstField = result.templates[0].tasks[0].fields[0];

      expect(firstField.name).toBeDefined();
      expect(firstField.value).toBeDefined();
      expect(typeof firstField.name).toBe('string');
      expect(typeof firstField.value).toBe('string');
    });
  });
});
