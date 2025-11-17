/**
 * Task model - Represents a task template
 */
import type { Field } from './Field';

export interface Task {
  name: string;
  fields: Field[];
}
