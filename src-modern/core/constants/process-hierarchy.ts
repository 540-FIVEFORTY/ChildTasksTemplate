/**
 * Process hierarchy configuration for Azure DevOps
 * Defines valid parent-child relationships for each process template
 */

export type ProcessTemplateType = 'Agile' | 'Scrum' | 'CMMI' | 'Basic';

export interface ProcessHierarchy {
  [parentType: string]: string[];
}

/**
 * Valid child work item types for each parent type, by process template
 */
export const PROCESS_HIERARCHIES: Record<ProcessTemplateType, ProcessHierarchy> = {
  Agile: {
    Epic: ['Feature'],
    Feature: ['User Story', 'Bug'],
    'User Story': ['Task', 'Bug'],
    Bug: ['Task'],
    Task: [],
  },
  Scrum: {
    Epic: ['Feature'],
    Feature: ['Product Backlog Item', 'Bug'],
    'Product Backlog Item': ['Task', 'Bug'],
    Bug: ['Task'],
    Task: [],
  },
  CMMI: {
    Epic: ['Feature'],
    Feature: ['Requirement', 'Bug'],
    Requirement: ['Task', 'Bug'],
    Bug: ['Task'],
    Task: [],
  },
  Basic: {
    Epic: ['Issue'],
    Issue: ['Task'],
    Task: [],
  },
};

/**
 * Process template type IDs from Azure DevOps
 * Used to identify the process template from API responses
 */
export const PROCESS_TEMPLATE_IDS: Record<string, ProcessTemplateType> = {
  // Built-in process template IDs
  'adcc42ab-9882-485e-a3ed-7678f01f66bc': 'Agile',
  '6b724908-ef14-45cf-84f8-768b5384da45': 'Scrum',
  '27450541-8e31-4150-9947-dc59f998fc01': 'CMMI',
  'b8a3a935-7e91-48b8-a94c-606d37c3e9f2': 'Basic',
};

/**
 * Process template names (for matching by name when ID is not available)
 */
export const PROCESS_TEMPLATE_NAMES: Record<string, ProcessTemplateType> = {
  agile: 'Agile',
  scrum: 'Scrum',
  cmmi: 'CMMI',
  basic: 'Basic',
};

/**
 * Get valid child work item types for a given parent type and process
 */
export function getValidChildTypes(
  processTemplate: ProcessTemplateType,
  parentWorkItemType: string
): string[] {
  const hierarchy = PROCESS_HIERARCHIES[processTemplate];
  if (!hierarchy) {
    // Default to Agile if process not found
    return PROCESS_HIERARCHIES.Agile[parentWorkItemType] || ['Task'];
  }
  return hierarchy[parentWorkItemType] || ['Task'];
}

/**
 * Check if a child type is valid for a given parent type and process
 */
export function isValidChildType(
  processTemplate: ProcessTemplateType,
  parentWorkItemType: string,
  childWorkItemType: string
): boolean {
  const validTypes = getValidChildTypes(processTemplate, parentWorkItemType);
  return validTypes.includes(childWorkItemType);
}

/**
 * Detect process template type from process ID, parent process ID, or name
 *
 * Azure DevOps supports inherited processes where organizations create custom
 * processes based on standard templates. Inherited processes have their own
 * unique IDs but inherit the work item type hierarchy from their parent.
 *
 * @param processId - The process ID (can be inherited process ID)
 * @param processName - The process name (often contains base process name)
 * @param parentProcessId - The parent process ID for inherited processes
 */
export function detectProcessTemplate(
  processId?: string,
  processName?: string,
  parentProcessId?: string
): ProcessTemplateType {
  // First, try to match the parent process ID (for inherited processes)
  if (parentProcessId && PROCESS_TEMPLATE_IDS[parentProcessId]) {
    return PROCESS_TEMPLATE_IDS[parentProcessId];
  }

  // Try to match by process ID directly (for standard processes)
  if (processId && PROCESS_TEMPLATE_IDS[processId]) {
    return PROCESS_TEMPLATE_IDS[processId];
  }

  // Try to match by name - inherited processes often include base process name
  // e.g., "My Company Agile" or "Custom Scrum Process"
  if (processName) {
    const normalizedName = processName.toLowerCase();
    for (const [key, value] of Object.entries(PROCESS_TEMPLATE_NAMES)) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
  }

  // Default to Agile as it's the most commonly used
  return 'Agile';
}

/**
 * Detect process template from process info object returned by Azure DevOps API
 * Works with both standard and inherited processes
 */
export function detectProcessTemplateFromInfo(processInfo: {
  typeId?: string;
  parentProcessTypeId?: string;
  name?: string;
  referenceName?: string;
}): ProcessTemplateType {
  return detectProcessTemplate(
    processInfo.typeId,
    processInfo.name || processInfo.referenceName,
    processInfo.parentProcessTypeId
  );
}
