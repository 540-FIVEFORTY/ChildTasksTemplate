/**
 * Template model - Represents a template containing multiple tasks
 */
import type { Task } from './Task';

export interface Template {
  name: string;
  tasks: Task[];
}
