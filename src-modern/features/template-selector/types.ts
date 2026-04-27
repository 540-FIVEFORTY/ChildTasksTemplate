/**
 * Template selector types
 */
import type { ChildTaskExecutionResult } from '@core/services/childTasks.service';

export interface IChooseTemplatePanelResult {
  names: string[];
  context: any;
  success: boolean;
  result?: ChildTaskExecutionResult;
}
