import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as SDK from 'azure-devops-extension-sdk';
import {
  ChildTasksService,
  type ChildTaskExecutionResult,
} from './childTasks.service';

describe('ChildTasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SDK.getHost).mockReturnValue({ name: 'test-org' } as never);
    vi.mocked(SDK.getAccessToken).mockResolvedValue('test-token');
  });

  it('returns a success summary when all child tasks are created', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          rev: 1,
          url: 'https://example/10',
          fields: {
            'System.Title': 'Parent',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 101 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 102 }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Template A',
        tasks: [
          {
            name: 'Task 1',
            workItemType: 'Task',
            fields: [{ name: 'System.Description', value: 'Description' }],
          },
          {
            name: 'Task 2',
            workItemType: 'Bug',
            fields: [],
          },
        ],
      },
    ]);

    const result = await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    expect(result).toEqual<ChildTaskExecutionResult>({
      status: 'success',
      attemptedCount: 2,
      createdCount: 2,
      failedCount: 0,
      createdWorkItemIds: [101, 102],
      items: [
        {
          templateName: 'Template A',
          taskName: 'Task 1',
          workItemType: 'Task',
          status: 'success',
          workItemId: 101,
        },
        {
          templateName: 'Template A',
          taskName: 'Task 2',
          workItemType: 'Bug',
          status: 'success',
          workItemId: 102,
        },
      ],
    });
  });

  it('continues after an item failure and reports a partial result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          rev: 1,
          url: 'https://example/10',
          fields: {
            'System.Title': 'Parent',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 101 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid field',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 103 }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Template A',
        tasks: [
          { name: 'Task 1', workItemType: 'Task', fields: [] },
          { name: 'Task 2', workItemType: 'Bug', fields: [] },
          { name: 'Task 3', workItemType: 'Task', fields: [] },
        ],
      },
    ]);

    const result = await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    expect(result.status).toBe('partial');
    expect(result.createdCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.createdWorkItemIds).toEqual([101, 103]);
    expect(result.items[1]).toEqual({
      templateName: 'Template A',
      taskName: 'Task 2',
      workItemType: 'Bug',
      status: 'failed',
      errorMessage:
        'API request failed: 400 Bad Request - Invalid field',
    });
  });
});
