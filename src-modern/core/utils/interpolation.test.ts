/**
 * Tests for interpolation utility
 */
import { describe, it, expect } from 'vitest';
import { interpolate } from './interpolation';
import type { WorkItem } from 'azure-devops-extension-api/WorkItemTracking';

// Helper to create mock WorkItem
function createMockWorkItem(
  fields: Record<string, any>,
  overrides: Partial<WorkItem> = {}
): WorkItem {
  return {
    id: 123,
    rev: 1,
    url: 'https://dev.azure.com/org/project/_apis/wit/workItems/123',
    fields,
    _links: {},
    relations: [],
    ...overrides,
  } as WorkItem;
}

describe('interpolate', () => {
  describe('basic interpolation', () => {
    it('should return null for null input', () => {
      const parent = createMockWorkItem({});
      expect(interpolate(null, parent)).toBeNull();
    });

    it('should return null for undefined input', () => {
      const parent = createMockWorkItem({});
      expect(interpolate(undefined, parent)).toBeNull();
    });

    it('should return null for empty string', () => {
      const parent = createMockWorkItem({});
      expect(interpolate('', parent)).toBeNull();
    });

    it('should return text unchanged when no placeholders', () => {
      const parent = createMockWorkItem({});
      expect(interpolate('Plain text', parent)).toBe('Plain text');
    });
  });

  describe('field interpolation', () => {
    it('should interpolate System.Title field', () => {
      const parent = createMockWorkItem({
        'System.Title': 'My Work Item',
      });
      expect(interpolate('{System.Title}', parent)).toBe('My Work Item');
    });

    it('should interpolate multiple fields', () => {
      const parent = createMockWorkItem({
        'System.Title': 'Task Title',
        'System.AreaPath': 'Project\\Team',
      });
      expect(interpolate('{System.Title} in {System.AreaPath}', parent)).toBe(
        'Task Title in Project\\Team'
      );
    });

    it('should interpolate id property', () => {
      const parent = createMockWorkItem({}, { id: 456 });
      expect(interpolate('Work Item #{id}', parent)).toBe('Work Item #456');
    });

    it('should interpolate rev property', () => {
      const parent = createMockWorkItem({}, { rev: 5 });
      expect(interpolate('Revision {rev}', parent)).toBe('Revision 5');
    });

    it('should interpolate complex template', () => {
      const parent = createMockWorkItem(
        {
          'System.Title': 'Feature Request',
          'System.IterationPath': 'Sprint 1',
          'Microsoft.VSTS.Common.Priority': 2,
        },
        { id: 789 }
      );
      expect(
        interpolate('{System.Title} DEV:{id} - Priority {Microsoft.VSTS.Common.Priority}', parent)
      ).toBe('Feature Request DEV:789 - Priority 2');
    });
  });

  describe('nested field access', () => {
    it('should handle deeply nested field names', () => {
      const parent = createMockWorkItem({
        'Custom.Nested.Field.Name': 'Nested Value',
      });
      expect(interpolate('{Custom.Nested.Field.Name}', parent)).toBe('Nested Value');
    });

    it('should handle single-part field names', () => {
      const parent = createMockWorkItem({
        SimpleField: 'Simple Value',
      });
      expect(interpolate('{SimpleField}', parent)).toBe('Simple Value');
    });
  });

  describe('edge cases', () => {
    it('should handle numeric field values', () => {
      const parent = createMockWorkItem({
        'Microsoft.VSTS.Scheduling.StoryPoints': 8,
      });
      expect(interpolate('Points: {Microsoft.VSTS.Scheduling.StoryPoints}', parent)).toBe(
        'Points: 8'
      );
    });

    it('should handle boolean field values', () => {
      const parent = createMockWorkItem({
        'Custom.IsBlocked': true,
      });
      expect(interpolate('Blocked: {Custom.IsBlocked}', parent)).toBe('Blocked: true');
    });

    it('should preserve text around placeholders', () => {
      const parent = createMockWorkItem({
        'System.Title': 'Test',
      });
      expect(interpolate('PREFIX-{System.Title}-SUFFIX', parent)).toBe('PREFIX-Test-SUFFIX');
    });
  });
});
