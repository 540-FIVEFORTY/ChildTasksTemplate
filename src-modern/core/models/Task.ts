/**
 * Task model - Represents a task template
 */
import type { Field } from './Field';

export interface Task {
  name: string;
  workItemType?: string; // Default is 'Task', but can be other types based on process
  fields: Field[];
}
