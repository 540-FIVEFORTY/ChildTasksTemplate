import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as SDK from 'azure-devops-extension-sdk';
import { TemplateService } from './template.service';

const CURRENT_KEY = 'ChildTasksTemplate_project-1';
const LEGACY_KEY = 'fiveforty-child-tasks-template-project-1';

describe('TemplateService', () => {
  const getProject = vi.fn();
  const getValue = vi.fn();
  const setValue = vi.fn();
  const getExtensionDataManager = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    getProject.mockResolvedValue({ id: 'project-1', name: 'Test Project' });
    getExtensionDataManager.mockResolvedValue({
      getValue,
      setValue,
    });

    vi.mocked(SDK.getAccessToken).mockResolvedValue('test-access-token');
    vi.mocked(SDK.getService).mockImplementation(async (serviceId) => {
      if (serviceId === 'ms.vss-tfs-web.tfs-page-data-service') {
        return { getProject } as never;
      }

      if (serviceId === 'ms.vss-features.extension-data-service') {
        return { getExtensionDataManager } as never;
      }

      throw new Error(`Unexpected service requested: ${serviceId}`);
    });
  });

  it('loads templates from the current key', async () => {
    getValue.mockImplementation(async (key: string) => {
      if (key === CURRENT_KEY) {
        return {
          version: 3,
          templates: [{ name: 'Current', tasks: [] }],
        };
      }

      return undefined;
    });

    const service = new TemplateService();
    const result = await service.getTemplateSetup();

    expect(result.templates[0].name).toBe('Current');
    expect(setValue).not.toHaveBeenCalled();
  });

  it('falls back to the legacy key and migrates the setup forward', async () => {
    getValue.mockImplementation(async (key: string) => {
      if (key === CURRENT_KEY) {
        return undefined;
      }

      if (key === LEGACY_KEY) {
        return JSON.stringify({
          tasks: [
            {
              name: 'Imported Task',
              fields: [{ name: 'System.Title', value: 'Example' }],
            },
          ],
        });
      }

      return undefined;
    });

    const service = new TemplateService();
    const result = await service.getTemplateSetup();

    expect(result.version).toBe(3);
    expect(result.templates[0].name).toBe('default');
    expect(result.templates[0].tasks[0].workItemType).toBe('Task');
    expect(setValue).toHaveBeenCalledWith(
      CURRENT_KEY,
      result,
      { scopeType: 'Default' }
    );
  });

  it('returns the default setup when no config exists', async () => {
    getValue.mockResolvedValue(undefined);

    const service = new TemplateService();
    const result = await service.getTemplateSetup();

    expect(result.version).toBe(3);
    expect(result.templates.length).toBeGreaterThan(0);
  });

  it('throws a load error when the backing store fails', async () => {
    getValue.mockRejectedValue(new Error('storage unavailable'));

    const service = new TemplateService();

    await expect(service.getTemplateSetup()).rejects.toThrow(
      'Failed to load templates configuration'
    );
  });

  it('rejects duplicate template names on save', async () => {
    const service = new TemplateService();

    await expect(
      service.saveTemplateSetup({
        version: 3,
        templates: [
          { name: 'Duplicate', tasks: [] },
          { name: 'Duplicate', tasks: [] },
        ],
      })
    ).rejects.toThrow('Template names must be unique');
  });
});
