# Architecture Moderne Proposée

## 🎯 Vue d'ensemble

Migration de l'extension Azure DevOps vers une architecture moderne basée sur les meilleures pratiques 2024/2025.

---

## 🏗️ Stack Technique Moderne

### **Build & Bundling**
- ❌ **Webpack 5** → ✅ **Vite 5**
  - Build 10-100x plus rapide
  - HMR (Hot Module Replacement) instantané
  - Configuration minimale
  - ESM natif

### **Framework**
- ❌ **React 16.8 + Class Components** → ✅ **React 18 + Hooks**
  - Composants fonctionnels
  - Concurrent rendering
  - Automatic batching
  - Server components ready

### **TypeScript**
- ❌ **TypeScript 5 (mode lax)** → ✅ **TypeScript 5 (strict mode)**
  - Types stricts partout
  - Pas de `any` implicite
  - Type inference amélioré

### **State Management**
- ❌ **Aucun** → ✅ **Zustand** (minimal et moderne)
  - 1KB gzippé
  - API simple et intuitive
  - Pas de boilerplate
  - DevTools intégré

### **Data Fetching**
- ❌ **Fetch vanilla** → ✅ **TanStack Query (React Query)**
  - Cache automatique
  - Background refetching
  - Optimistic updates
  - Error handling intégré

### **JSON Editing**
- ❌ **jsoneditor** → ✅ **Monaco Editor**
  - L'éditeur de VS Code
  - IntelliSense intégré
  - Validation JSON native
  - Thèmes customisables

### **Testing**
- ❌ **Aucun** → ✅ **Vitest + Testing Library**
  - Tests ultra-rapides
  - Compatible Vite
  - Coverage intégré
  - Mocking moderne

### **Code Quality**
- ✅ **ESLint 8** (déjà présent)
- ✅ **Prettier** (à configurer)
- ✅ **Husky + lint-staged** (pre-commit hooks)

---

## 📁 Nouvelle Structure de Projet

```
src/
├── core/                    # Logique métier pure
│   ├── services/           # Services Azure DevOps
│   │   ├── childTasks.service.ts
│   │   ├── settings.service.ts
│   │   └── index.ts
│   ├── models/             # Types & interfaces
│   │   ├── Template.ts
│   │   ├── Task.ts
│   │   ├── Field.ts
│   │   └── index.ts
│   └── utils/              # Utilitaires
│       ├── interpolation.ts
│       ├── locale.ts
│       └── index.ts
│
├── features/               # Fonctionnalités (Feature-based)
│   ├── template-editor/   # Feature: Éditeur de templates
│   │   ├── components/
│   │   │   ├── TemplateEditor.tsx
│   │   │   ├── JsonEditor.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useTemplateEditor.ts
│   │   │   ├── useFieldValidation.ts
│   │   │   └── index.ts
│   │   ├── store/
│   │   │   └── templateStore.ts
│   │   └── index.tsx
│   │
│   ├── template-selector/  # Feature: Sélection de templates
│   │   ├── components/
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── TemplateItem.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useTemplateList.ts
│   │   │   └── index.ts
│   │   └── index.tsx
│   │
│   └── task-creation/      # Feature: Création de tâches
│       ├── components/
│       │   └── TaskCreator.tsx
│       ├── hooks/
│       │   ├── useTaskCreation.ts
│       │   └── index.ts
│       └── index.tsx
│
├── shared/                 # Code partagé
│   ├── components/        # Composants réutilisables
│   │   ├── Button/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── hooks/             # Hooks partagés
│   │   ├── useAzureDevOps.ts
│   │   ├── useProject.ts
│   │   └── index.ts
│   └── constants/
│       └── index.ts
│
├── pages/                  # Pages de l'extension
│   ├── SettingsPage.tsx
│   ├── ChooseTemplatePage.tsx
│   └── index.ts
│
├── config/                 # Configuration
│   ├── query-client.ts
│   ├── azure-devops.ts
│   └── index.ts
│
└── main.tsx               # Entry points
    ├── extension.tsx
    ├── settings.tsx
    └── chooseTemplate.tsx
```

---

## 🔄 Comparaison Architecture

### **Ancien (Class Component)**

```typescript
export class ChooseTemplatePanel extends Component<{}, IChooseTemplatePanelState> {
    private onCheckedTemplatesChange = (templates: string[]): void => {
        let state: IChooseTemplatePanelState = this.state;
        state.checks = [];  // ❌ Mutation directe
        this.state.names.map(name => {
            state.checks.push(templates.findIndex(e => e == name) >= 0 ? true : false)
        });
        this.setState(state)  // ❌ Anti-pattern
    }

    public async componentDidMount() {
        // ❌ Logique métier dans le composant
        let init = SDK.init()
        this.setTemplateList(await this.getTemplateNames());
        await SDK.ready()
        // ...
    }

    public render(): JSX.Element {
        return (
            <div className="choose-template-panel flex-column flex-grow">
                <TemplateSelect
                    names={this.state?.names}
                    onCheckedNamesChange={this.onCheckedTemplatesChange}
                />
                {/* ... */}
            </div>
        )
    }
}
```

### **Nouveau (Hooks + Architecture en couches)**

```typescript
// ✅ Hook personnalisé (Business Logic Layer)
function useTemplateSelection() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplateNames()
  });

  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const toggleTemplate = useCallback((name: string) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;  // ✅ Immutabilité
    });
  }, []);

  return {
    templates: templates ?? [],
    selectedTemplates: Array.from(selectedTemplates),
    toggleTemplate,
    isLoading
  };
}

// ✅ Composant (Presentation Layer)
export function ChooseTemplatePanel() {
  const { templates, selectedTemplates, toggleTemplate, isLoading } = useTemplateSelection();
  const dialog = useAzureDialog();

  const handleSubmit = useCallback(async () => {
    if (selectedTemplates.length > 0) {
      await taskService.createFromTemplates(selectedTemplates);
      dialog.close({ success: true });
    }
  }, [selectedTemplates, dialog]);

  if (isLoading) {
    return <Spinner label="Loading templates..." />;
  }

  return (
    <div className="choose-template-panel">
      <TemplateSelector
        templates={templates}
        selected={selectedTemplates}
        onToggle={toggleTemplate}
      />
      <DialogActions
        onCancel={() => dialog.close({ success: false })}
        onSubmit={handleSubmit}
        submitDisabled={selectedTemplates.length === 0}
      />
    </div>
  );
}
```

---

## 🎨 Nouveaux Patterns

### **1. Custom Hooks Pattern**

Extraction de la logique métier dans des hooks réutilisables :

```typescript
// hooks/useFieldValuePreservation.ts
export function useFieldValuePreservation() {
  const preserveValues = useCallback((data: TemplateSetup) => {
    const locale = navigator.language || 'en-US';
    const isFrench = locale.startsWith('fr') || locale.includes('-FR');

    return {
      ...data,
      templates: data.templates.map(template => ({
        ...template,
        tasks: template.tasks.map(task => ({
          ...task,
          fields: task.fields.map(field => ({
            ...field,
            value: preserveFieldValue(field.value, isFrench)
          }))
        }))
      }))
    };
  }, []);

  return { preserveValues };
}

function preserveFieldValue(value: unknown, isFrench: boolean): string {
  if (value == null) return '';

  if (typeof value === 'number') {
    const str = value.toString();
    return isFrench ? str.replace('.', ',') : str;
  }

  return String(value);
}
```

### **2. Service Layer Pattern**

Séparation complète de la logique d'accès aux données :

```typescript
// core/services/childTasks.service.ts
export class ChildTasksService {
  constructor(
    private workClient: WorkItemTrackingRestClient,
    private formService: IWorkItemFormService
  ) {}

  async createTasksFromTemplates(
    parentId: number,
    templates: Template[]
  ): Promise<WorkItem[]> {
    const parent = await this.workClient.getWorkItem(parentId);
    const createdTasks: WorkItem[] = [];

    for (const template of templates) {
      for (const task of template.tasks) {
        const workItem = await this.createTask(parent, task);
        createdTasks.push(workItem);
      }
    }

    await this.refreshFormIfNeeded();
    return createdTasks;
  }

  private async createTask(parent: WorkItem, task: Task): Promise<WorkItem> {
    const patch = this.buildPatchDocument(parent, task);
    return this.workClient.createWorkItem(
      patch,
      parent.fields['System.TeamProject'],
      'Task'
    );
  }

  private buildPatchDocument(parent: WorkItem, task: Task): JsonPatchDocument {
    const operations: JsonPatchOperation[] = [
      this.createParentRelation(parent),
      ...task.fields.map(field =>
        this.createFieldOperation(field, parent)
      )
    ];
    return operations as JsonPatchDocument;
  }

  private createFieldOperation(field: Field, parent: WorkItem): JsonPatchOperation {
    return {
      op: Operation.Add,
      path: `/fields/${field.name}`,
      value: interpolate(field.value, parent)
    };
  }

  // ... autres méthodes privées
}
```

### **3. Store Pattern (Zustand)**

Gestion d'état simple et performante :

```typescript
// features/template-editor/store/templateStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TemplateEditorState {
  // State
  templateSetup: TemplateSetup | null;
  isDirty: boolean;
  validationErrors: ValidationError[];

  // Actions
  setTemplateSetup: (setup: TemplateSetup) => void;
  updateField: (path: string[], value: string) => void;
  addTask: (templateIndex: number) => void;
  removeTask: (templateIndex: number, taskIndex: number) => void;
  validate: () => boolean;
  reset: () => void;
}

export const useTemplateEditorStore = create<TemplateEditorState>()(
  devtools(
    (set, get) => ({
      templateSetup: null,
      isDirty: false,
      validationErrors: [],

      setTemplateSetup: (setup) => set({
        templateSetup: setup,
        isDirty: false
      }),

      updateField: (path, value) => set((state) => {
        const newSetup = updateNestedValue(state.templateSetup, path, value);
        return {
          templateSetup: newSetup,
          isDirty: true
        };
      }),

      validate: () => {
        const errors = validateTemplateSetup(get().templateSetup);
        set({ validationErrors: errors });
        return errors.length === 0;
      },

      reset: () => set({
        templateSetup: null,
        isDirty: false,
        validationErrors: []
      })
    }),
    { name: 'TemplateEditor' }
  )
);
```

### **4. Query Pattern (TanStack Query)**

```typescript
// features/template-editor/hooks/useTemplateData.ts
export function useTemplateData() {
  const queryClient = useQueryClient();

  // Lecture
  const { data, isLoading, error } = useQuery({
    queryKey: ['templateSetup'],
    queryFn: () => settingsService.getTemplateSetup(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Écriture avec optimistic update
  const { mutate: saveTemplate, isPending } = useMutation({
    mutationFn: (setup: TemplateSetup) =>
      settingsService.saveTemplateSetup(setup),

    onMutate: async (newSetup) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['templateSetup'] });
      const previous = queryClient.getQueryData(['templateSetup']);
      queryClient.setQueryData(['templateSetup'], newSetup);
      return { previous };
    },

    onError: (err, newSetup, context) => {
      // Rollback en cas d'erreur
      queryClient.setQueryData(['templateSetup'], context.previous);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  return {
    templateSetup: data,
    isLoading,
    error,
    saveTemplate,
    isSaving: isPending
  };
}
```

---

## 🚀 Avantages de la Nouvelle Architecture

### **Performance**
- ⚡ **Vite** : Build 10-100x plus rapide que Webpack
- ⚡ **React 18** : Concurrent rendering, automatic batching
- ⚡ **Code splitting** automatique
- ⚡ **Tree shaking** optimal

### **Developer Experience**
- 🔥 **HMR instantané** (< 100ms)
- 🔍 **TypeScript strict** : Moins de bugs
- 🧪 **Tests rapides** avec Vitest
- 🛠️ **DevTools** pour debug (React Query, Zustand)

### **Maintenabilité**
- 📦 **Feature-based** : Code organisé par fonctionnalité
- 🔌 **Découplage** : Services, hooks, composants séparés
- ♻️ **Réutilisabilité** : Hooks et composants partagés
- 📝 **Testabilité** : Logique métier facile à tester

### **Code Quality**
- ✅ **Immutabilité** partout
- ✅ **Types stricts**
- ✅ **Pas de mutations**
- ✅ **Composition > Héritage**

---

## 📦 Nouvelles Dépendances

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.1",
    "immer": "^10.1.1"
  },
  "devDependencies": {
    "vite": "^6.0.1",
    "vitest": "^2.1.6",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@monaco-editor/react": "^4.6.0",
    "typescript": "^5.4.5"
  }
}
```

---

## 🔧 Configuration Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        extension: resolve(__dirname, 'src/extension/index.html'),
        settings: resolve(__dirname, 'src/settings/index.html'),
        chooseTemplate: resolve(__dirname, 'src/chooseTemplate/index.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020'
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@features': resolve(__dirname, 'src/features'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },

  server: {
    port: 6221,
    https: true
  }
});
```

---

## 📈 Migration Progressive

### **Phase 1** : Infrastructure
- ✅ Setup Vite
- ✅ Migration React 18
- ✅ Setup TanStack Query
- ✅ Setup Zustand

### **Phase 2** : Refactoring Components
- ✅ ChooseTemplatePanel → Hooks
- ✅ TemplateEditor → Hooks + Monaco
- ✅ Settings → Hooks

### **Phase 3** : Tests & Quality
- ✅ Setup Vitest
- ✅ Tests unitaires (hooks, services)
- ✅ Tests d'intégration (composants)
- ✅ E2E tests

### **Phase 4** : Optimisations
- ✅ Code splitting avancé
- ✅ Lazy loading
- ✅ Performance monitoring

---

## 🎯 Résultat Attendu

- 🚀 **Build time** : 30s → 2s
- 🚀 **HMR** : 3s → 100ms
- 📉 **Bundle size** : -30% (tree shaking)
- ✅ **Type safety** : 100%
- ✅ **Test coverage** : > 80%
- 📱 **Maintenabilité** : ⭐⭐⭐⭐⭐

---

## 📚 Ressources

- [Vite](https://vitejs.dev/)
- [React 18](https://react.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
