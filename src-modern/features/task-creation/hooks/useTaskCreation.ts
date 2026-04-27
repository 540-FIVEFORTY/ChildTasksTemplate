/**
 * Hook for task creation
 */
import { useMutation } from '@tanstack/react-query';
import {
  ChildTasksService,
  type ChildTaskExecutionResult,
} from '@core/services/childTasks.service';
import { templateService } from '@core/services';

interface CreateTasksParams {
  context: any;
  templateNames: string[];
}

export function useTaskCreation() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ context, templateNames }: CreateTasksParams) => {
      const templates = await templateService.getTemplates(templateNames);
      const service = new ChildTasksService(templates);
      return service.execute(context);
    },
  });

  return {
    createTasks: mutateAsync as (
      params: CreateTasksParams
    ) => Promise<ChildTaskExecutionResult>,
    isCreating: isPending,
  };
}
