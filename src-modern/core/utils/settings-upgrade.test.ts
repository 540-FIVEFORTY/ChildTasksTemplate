/**
 * Tests for SettingsUpgrade utility
 */
import { describe, it, expect } from 'vitest';
import { SettingsUpgrade } from './settings-upgrade';
import type { TemplateSetup } from '../models/TemplateSetup';

describe('SettingsUpgrade', () => {
  describe('upgradeToCurrent', () => {
    it('should return default setup when input is null', () => {
      const result = SettingsUpgrade.upgradeToCurrent(null);

      expect(result).toBeDefined();
      expect(result.version).toBe(3);
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should return default setup when input is undefined', () => {
      const result = SettingsUpgrade.upgradeToCurrent(undefined);

      expect(result).toBeDefined();
      expect(result.version).toBe(3);
    });

    it('should parse stored JSON strings', () => {
      const result = SettingsUpgrade.upgradeToCurrent(
        JSON.stringify({
          version: 3,
          templates: [
            {
              name: 'Imported',
              tasks: [{ name: 'Task A', fields: [] }],
            },
          ],
        })
      );

      expect(result.version).toBe(3);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('Imported');
    });

    it('should upgrade legacy tasks array format to the current schema', () => {
      const v1Config = {
        tasks: [
          {
            name: 'Task 1',
            fields: [{ name: 'System.Title', value: 'Test' }],
          },
        ],
      };

      const result = SettingsUpgrade.upgradeToCurrent(v1Config);

      expect(result.version).toBe(3);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('default');
      expect(result.templates[0].tasks[0].name).toBe('Task 1');
      expect(result.templates[0].tasks[0].fields).toEqual([
        { name: 'System.Title', value: 'Test', type: undefined },
      ]);
      expect(result.templates[0].tasks[0].workItemType).toBe('Task');
    });

    it('should upgrade legacy template-based configs to the current version', () => {
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

      expect(result.version).toBe(3);
      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].name).toBe('template1');
      expect(result.templates[1].name).toBe('template2');
      expect(result.templates[0].tasks[0].workItemType).toBe('Task');
    });

    it('should return current version config unchanged', () => {
      const v3Config: TemplateSetup = {
        version: 3,
        templates: [
          {
            name: 'template1',
            tasks: [
              {
                name: 'Task A',
                workItemType: 'Bug',
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

      const result = SettingsUpgrade.upgradeToCurrent(v3Config);

      expect(result.version).toBe(3);
      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].tasks[0].workItemType).toBe('Bug');
      expect(result.templates[1].tasks[0].workItemType).toBe('Task');
      expect(result.templates[0].tasks[0].fields[0]).toEqual({
        name: 'System.Title',
        value: 'A',
        type: undefined,
      });
    });

    it('should throw for invalid stored JSON strings', () => {
      expect(() => SettingsUpgrade.upgradeToCurrent('{invalid-json}')).toThrow(
        'Invalid template setup JSON'
      );
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
      expect(result.version).toBe(3);
      expect(result.templates).toBeDefined();
      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('should return the shipped sample template containing tasks', () => {
      const result = SettingsUpgrade.getDefaultSetup();
      const defaultTemplate = result.templates.find(
        (t) => t.name === 'Development'
      );

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
