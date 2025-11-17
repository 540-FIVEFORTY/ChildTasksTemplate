/**
 * TemplateSetup model - Complete template configuration
 */
import type { Template } from './Template';

export interface TemplateSetup {
  version: number;
  templates: Template[];
}
