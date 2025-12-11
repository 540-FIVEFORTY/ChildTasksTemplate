/**
 * Zustand Store - Template Editor
 * Gestion d'état centralisée pour l'éditeur de templates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { TemplateSetup, Template, Task, Field, FieldType } from '@core/models';

/**
 * Erreur de validation
 */
export interface ValidationError {
  path: string[];
  message: string;
  severity: 'error' | 'warning';
}

/**
 * État du store de l'éditeur de templates
 */
interface TemplateEditorState {
  // State
  templateSetup: TemplateSetup | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  isValidating: boolean;

  // Computed (pour éviter de recalculer)
  hasErrors: boolean;
  hasWarnings: boolean;

  // Actions - Configuration
  setTemplateSetup: (setup: TemplateSetup) => void;
  reset: () => void;

  // Actions - Templates
  addTemplate: () => void;
  removeTemplate: (index: number) => void;
  updateTemplateName: (index: number, name: string) => void;

  // Actions - Tasks
  addTask: (templateIndex: number) => void;
  removeTask: (templateIndex: number, taskIndex: number) => void;
  updateTaskName: (templateIndex: number, taskIndex: number, name: string) => void;
  updateTaskWorkItemType: (templateIndex: number, taskIndex: number, workItemType: string) => void;

  // Actions - Fields
  addField: (templateIndex: number, taskIndex: number) => void;
  removeField: (templateIndex: number, taskIndex: number, fieldIndex: number) => void;
  updateFieldName: (
    templateIndex: number,
    taskIndex: number,
    fieldIndex: number,
    name: string
  ) => void;
  updateFieldValue: (
    templateIndex: number,
    taskIndex: number,
    fieldIndex: number,
    value: string
  ) => void;
  updateFieldType: (
    templateIndex: number,
    taskIndex: number,
    fieldIndex: number,
    type: FieldType
  ) => void;

  // Actions - Validation
  validate: () => Promise<boolean>;
  clearValidationErrors: () => void;
}

/**
 * Créer un template vide
 */
function createEmptyTemplate(index: number): Template {
  return {
    name: `Template ${index + 1}`,
    tasks: [],
  };
}

/**
 * Créer une task vide
 */
function createEmptyTask(index: number): Task {
  return {
    name: `Task ${index + 1}`,
    fields: [],
  };
}

/**
 * Créer un field vide
 */
function createEmptyField(): Field {
  return {
    name: '',
    value: '',
  };
}

/**
 * Valider le setup de templates
 */
async function validateSetup(setup: TemplateSetup | null): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!setup) {
    return errors;
  }

  // Validation des templates
  setup.templates.forEach((template, tIndex) => {
    // Nom vide
    if (!template.name.trim()) {
      errors.push({
        path: ['templates', String(tIndex), 'name'],
        message: 'Template name is required',
        severity: 'error',
      });
    }

    // Tasks
    template.tasks.forEach((task, taskIndex) => {
      // Nom vide
      if (!task.name.trim()) {
        errors.push({
          path: ['templates', String(tIndex), 'tasks', String(taskIndex), 'name'],
          message: 'Task name is required',
          severity: 'error',
        });
      }

      // Fields
      task.fields.forEach((field, fieldIndex) => {
        // Nom vide
        if (!field.name.trim()) {
          errors.push({
            path: [
              'templates',
              String(tIndex),
              'tasks',
              String(taskIndex),
              'fields',
              String(fieldIndex),
              'name',
            ],
            message: 'Field name is required',
            severity: 'error',
          });
        }

        // Warning si value vide (pas une erreur)
        if (field.value !== undefined && !field.value.trim()) {
          errors.push({
            path: [
              'templates',
              String(tIndex),
              'tasks',
              String(taskIndex),
              'fields',
              String(fieldIndex),
              'value',
            ],
            message: 'Field value is empty',
            severity: 'warning',
          });
        }
      });
    });
  });

  // Noms de templates en double
  const names = setup.templates.map((t) => t.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    errors.push({
      path: ['templates'],
      message: `Duplicate template names: ${duplicates.join(', ')}`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Store Zustand pour l'éditeur de templates
 * Utilise immer pour l'immutabilité et devtools pour le debug
 */
export const useTemplateEditorStore = create<TemplateEditorState>()(
  devtools(
    immer((set, get) => ({
      // État initial
      templateSetup: null,
      isDirty: false,
      validationErrors: [],
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,

      // Configuration
      setTemplateSetup: (setup) =>
        set((state) => {
          state.templateSetup = setup;
          state.isDirty = false;
          state.validationErrors = [];
        }),

      reset: () =>
        set((state) => {
          state.templateSetup = null;
          state.isDirty = false;
          state.validationErrors = [];
          state.isValidating = false;
        }),

      // Templates
      addTemplate: () =>
        set((state) => {
          if (!state.templateSetup) return;
          const index = state.templateSetup.templates.length;
          state.templateSetup.templates.push(createEmptyTemplate(index));
          state.isDirty = true;
        }),

      removeTemplate: (index) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates.splice(index, 1);
          state.isDirty = true;
        }),

      updateTemplateName: (index, name) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates[index].name = name;
          state.isDirty = true;
        }),

      // Tasks
      addTask: (templateIndex) =>
        set((state) => {
          if (!state.templateSetup) return;
          const template = state.templateSetup.templates[templateIndex];
          const index = template.tasks.length;
          template.tasks.push(createEmptyTask(index));
          state.isDirty = true;
        }),

      removeTask: (templateIndex, taskIndex) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates[templateIndex].tasks.splice(taskIndex, 1);
          state.isDirty = true;
        }),

      updateTaskName: (templateIndex, taskIndex, name) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates[templateIndex].tasks[taskIndex].name = name;
          state.isDirty = true;
        }),

      updateTaskWorkItemType: (templateIndex, taskIndex, workItemType) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates[templateIndex].tasks[taskIndex].workItemType = workItemType;
          state.isDirty = true;
        }),

      // Fields
      addField: (templateIndex, taskIndex) =>
        set((state) => {
          if (!state.templateSetup) return;
          const task = state.templateSetup.templates[templateIndex].tasks[taskIndex];
          task.fields.push(createEmptyField());
          state.isDirty = true;
        }),

      removeField: (templateIndex, taskIndex, fieldIndex) =>
        set((state) => {
          if (!state.templateSetup) return;
          state.templateSetup.templates[templateIndex].tasks[taskIndex].fields.splice(
            fieldIndex,
            1
          );
          state.isDirty = true;
        }),

      updateFieldName: (templateIndex, taskIndex, fieldIndex, name) =>
        set((state) => {
          if (!state.templateSetup) return;
          const field =
            state.templateSetup.templates[templateIndex].tasks[taskIndex].fields[
              fieldIndex
            ];
          field.name = name;
          state.isDirty = true;
        }),

      updateFieldValue: (templateIndex, taskIndex, fieldIndex, value) =>
        set((state) => {
          if (!state.templateSetup) return;
          const field =
            state.templateSetup.templates[templateIndex].tasks[taskIndex].fields[
              fieldIndex
            ];
          field.value = value;
          state.isDirty = true;
        }),

      updateFieldType: (templateIndex, taskIndex, fieldIndex, type) =>
        set((state) => {
          if (!state.templateSetup) return;
          const field =
            state.templateSetup.templates[templateIndex].tasks[taskIndex].fields[
              fieldIndex
            ];
          field.type = type;
          state.isDirty = true;
        }),

      // Validation
      validate: async () => {
        set((state) => {
          state.isValidating = true;
        });

        const errors = await validateSetup(get().templateSetup);

        set((state) => {
          state.validationErrors = errors;
          state.isValidating = false;
          state.hasErrors = errors.some((e) => e.severity === 'error');
          state.hasWarnings = errors.some((e) => e.severity === 'warning');
        });

        return errors.length === 0;
      },

      clearValidationErrors: () =>
        set((state) => {
          state.validationErrors = [];
          state.hasErrors = false;
          state.hasWarnings = false;
        }),
    })),
    { name: 'TemplateEditor' }
  )
);
