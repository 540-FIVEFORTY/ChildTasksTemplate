import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as SDK from 'azure-devops-extension-sdk';
import {
  ChildTasksService,
  type ChildTaskExecutionResult,
} from './childTasks.service';

interface JsonPatchOperation {
  op: string;
  path: string;
  value?: unknown;
}

function mockParentFetch(fields: Record<string, unknown> = { 'System.Title': 'Parent' }) {
  return {
    ok: true,
    json: async () => ({
      id: 10,
      rev: 1,
      url: 'https://example/10',
      fields,
    }),
  };
}

function mockCreateFetch(id: number) {
  return {
    ok: true,
    json: async () => ({ id }),
  };
}

function getCreatePatches(fetchMock: ReturnType<typeof vi.fn>): JsonPatchOperation[][] {
  return fetchMock.mock.calls
    .filter(([, options]) => options?.method === 'POST')
    .map(([, options]) => JSON.parse(options.body) as JsonPatchOperation[]);
}

function fieldOperations(patch: JsonPatchOperation[], fieldName: string): JsonPatchOperation[] {
  return patch.filter(
    (operation) => operation.path.toLowerCase() === `/fields/${fieldName}`.toLowerCase()
  );
}

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

  it('does not send System.Title twice when the template also defines it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        mockParentFetch({
          'System.Title': 'TEST3',
          'System.IterationPath': 'TEST3',
          'System.AreaPath': 'TEST3',
        })
      )
      .mockResolvedValueOnce(mockCreateFetch(201));

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Test Evolution',
        tasks: [
          {
            name: 'Task 2',
            workItemType: 'Task',
            fields: [
              {
                name: 'System.Title',
                value: '2 - Specify the system solution - {System.Title}',
              },
              {
                name: 'System.Description',
                value: '<h2>Task Description</h2>',
              },
              { name: 'System.IterationPath', value: '{System.IterationPath}' },
              { name: 'System.AreaPath', value: '{System.AreaPath}' },
              {
                name: 'Microsoft.VSTS.Scheduling.OriginalEstimate',
                value: '6',
              },
              {
                name: 'Microsoft.VSTS.Scheduling.RemainingWork',
                value: '6',
              },
            ],
          },
        ],
      },
    ]);

    const result = await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    expect(result.status).toBe('success');

    const [patch] = getCreatePatches(fetchMock);
    const titleOps = fieldOperations(patch, 'System.Title');

    expect(titleOps).toHaveLength(1);
    expect(titleOps[0].value).toBe('2 - Specify the system solution - TEST3');
    expect(fieldOperations(patch, 'System.IterationPath')[0].value).toBe('TEST3');
    expect(
      fieldOperations(patch, 'Microsoft.VSTS.Scheduling.OriginalEstimate')[0]
        .value
    ).toBe(6);
  });

  it('uses the interpolated task name as title when System.Title is not a field', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockParentFetch({ 'System.Title': 'Parent' }))
      .mockResolvedValueOnce(mockCreateFetch(202));

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Template A',
        tasks: [
          {
            name: 'Review {System.Title}',
            workItemType: 'Task',
            fields: [{ name: 'System.Description', value: 'Notes' }],
          },
        ],
      },
    ]);

    await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    const [patch] = getCreatePatches(fetchMock);
    const titleOps = fieldOperations(patch, 'System.Title');

    expect(titleOps).toHaveLength(1);
    expect(titleOps[0].value).toBe('Review Parent');
    expect(fieldOperations(patch, 'System.Description')).toHaveLength(1);
  });

  it('collapses duplicate field names case-insensitively', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockParentFetch({ 'System.Title': 'Parent' }))
      .mockResolvedValueOnce(mockCreateFetch(203));

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Template A',
        tasks: [
          {
            name: 'Task 1',
            workItemType: 'Task',
            fields: [
              { name: 'System.Title', value: 'First title' },
              { name: 'system.title', value: 'Second title - {System.Title}' },
            ],
          },
        ],
      },
    ]);

    await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    const [patch] = getCreatePatches(fetchMock);
    const titleOps = fieldOperations(patch, 'System.Title');

    expect(titleOps).toHaveLength(1);
    expect(titleOps[0].value).toBe('Second title - Parent');
  });
  it('treats placeholders for empty parent fields as empty and skips the field', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockParentFetch({ 'System.Title': 'Parent' }))
      .mockResolvedValueOnce(mockCreateFetch(204));

    vi.stubGlobal('fetch', fetchMock);

    const service = new ChildTasksService([
      {
        name: 'Template A',
        tasks: [
          {
            name: 'Review {System.Title}',
            workItemType: 'Task',
            fields: [
              { name: 'System.AssignedTo', value: '{System.AssignedTo.uniqueName}' },
              { name: 'System.Description', value: 'Owner: {System.AssignedTo.displayName}' },
            ],
          },
        ],
      },
    ]);

    const result = await service.execute({
      workItemAvailable: true,
      currentProjectGuid: 'project-1',
      workItemId: 10,
    });

    expect(result.status).toBe('success');

    const [patch] = getCreatePatches(fetchMock);

    expect(fieldOperations(patch, 'System.AssignedTo')).toHaveLength(0);
    expect(fieldOperations(patch, 'System.Description')[0].value).toBe('Owner: ');
  });
});
