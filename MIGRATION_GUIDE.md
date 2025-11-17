# Guide de Migration vers Architecture Moderne

## 🎯 Objectif

Migrer l'extension Azure DevOps Child Tasks Template vers une architecture moderne basée sur :
- **Vite** (au lieu de Webpack)
- **React 18 + Hooks** (au lieu de Class Components)
- **TypeScript strict mode**
- **Architecture en couches** (Presentation / Business Logic / Data Access)

---

## 📋 Plan de Migration

### Phase 1 : Préparation (1 jour)

**✅ Configuration Vite**
- [x] Créer `vite.config.ts`
- [x] Créer `vitest.config.ts`
- [x] Mettre à jour `package.json`

**✅ Dépendances**
```bash
npm install -D vite @vitejs/plugin-react vitest @vitest/ui
npm install react@18 react-dom@18
npm install @tanstack/react-query zustand immer
npm install -D @testing-library/react @testing-library/jest-dom
```

---

### Phase 2 : Refactoring Services (2-3 jours)

**Créer le Service Layer**

1. **Template Service** ✅ (exemple créé)
   - `src/core/services/template.service.ts`
   - Gestion des templates (CRUD)
   - Validation

2. **Child Tasks Service** (à migrer)
   - `src/core/services/childTasks.service.ts`
   - Création de tâches
   - Interpolation de valeurs

3. **Settings Service** (à créer)
   - `src/core/services/settings.service.ts`
   - Gestion des paramètres projet

**Tests unitaires pour services**
```typescript
// src/core/services/__tests__/template.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { templateService } from '../template.service';

describe('TemplateService', () => {
  it('should load templates', async () => {
    const templates = await templateService.getTemplateNames();
    expect(Array.isArray(templates)).toBe(true);
  });

  // ... plus de tests
});
```

---

### Phase 3 : Composants React 18 (3-4 jours)

**Migration ChooseTemplatePanel** ✅ (exemple créé)

Avant (Class Component) :
```typescript
export class ChooseTemplatePanel extends Component<{}, State> {
  async componentDidMount() {
    // logique métier ici
  }

  render() {
    return <div>...</div>
  }
}
```

Après (Functional Component + Hooks) :
```typescript
export function TemplateSelectorPanel() {
  const { templates, selectedTemplates, toggleTemplate } = useTemplateSelection();
  const { createTasks } = useTaskCreation();

  return <div>...</div>
}
```

**Migration Settings Panel**

1. Créer hooks personnalisés :
   - `useTemplateEditor()` ✅ (store créé)
   - `useFieldValidation()`
   - `useMonacoEditor()`

2. Remplacer JSONEditor par Monaco Editor :
```typescript
import Editor from '@monaco-editor/react';

function TemplateEditor() {
  const { templateSetup, updateSetup } = useTemplateEditorStore();

  return (
    <Editor
      language="json"
      value={JSON.stringify(templateSetup, null, 2)}
      onChange={(value) => {
        const parsed = JSON.parse(value);
        updateSetup(parsed);
      }}
      options={{
        minimap: { enabled: false },
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
```

---

### Phase 4 : State Management (1-2 jours)

**Zustand Store** ✅ (exemple créé)

Utiliser Zustand pour l'état global :
```typescript
// Template Editor Store ✅
const useTemplateEditorStore = create<State>()(...);

// Utilisation dans composants
function MyComponent() {
  const { templateSetup, updateField } = useTemplateEditorStore();
  // ...
}
```

---

### Phase 5 : Data Fetching avec React Query (1 jour)

**Queries**
```typescript
// Lecture de données
const { data: templates } = useQuery({
  queryKey: ['templates'],
  queryFn: () => templateService.getTemplateNames(),
});
```

**Mutations**
```typescript
// Écriture de données
const { mutate: saveTemplate } = useMutation({
  mutationFn: (setup) => templateService.saveTemplateSetup(setup),
  onSuccess: () => {
    queryClient.invalidateQueries(['templates']);
  },
});
```

---

### Phase 6 : Tests (2-3 jours)

**Setup Vitest**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Azure DevOps SDK
vi.mock('azure-devops-extension-sdk', () => ({
  init: vi.fn(),
  ready: vi.fn(),
  getService: vi.fn(),
  // ...
}));
```

**Tests Composants**
```typescript
import { render, screen } from '@testing-library/react';
import { TemplateSelectorPanel } from '../TemplateSelectorPanel';

describe('TemplateSelectorPanel', () => {
  it('renders template list', () => {
    render(<TemplateSelectorPanel />);
    expect(screen.getByText('Choose templates')).toBeInTheDocument();
  });
});
```

**Tests Hooks**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTemplateSelection } from '../useTemplateSelection';

describe('useTemplateSelection', () => {
  it('toggles template selection', () => {
    const { result } = renderHook(() => useTemplateSelection());

    act(() => {
      result.current.toggleTemplate('Template 1');
    });

    expect(result.current.isSelected('Template 1')).toBe(true);
  });
});
```

---

### Phase 7 : Build & Deploy (1 jour)

**Scripts package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "package": "npm run build && tfx extension create"
  }
}
```

**Vérifications**
- ✅ Build production fonctionne
- ✅ Package .vsix créé
- ✅ Extension installable dans Azure DevOps
- ✅ Toutes les fonctionnalités testées

---

## 🔄 Checklist de Migration

### Services
- [ ] TemplateService migré
- [ ] ChildTasksService migré
- [ ] SettingsService créé
- [ ] Tests services (> 80% coverage)

### Composants
- [ ] ChooseTemplatePanel → TemplateSelectorPanel
- [ ] Settings → TemplateEditorPanel
- [ ] Extension entry point migré
- [ ] Tests composants

### Hooks
- [ ] useTemplateSelection
- [ ] useTaskCreation
- [ ] useTemplateEditor
- [ ] useFieldValidation
- [ ] useAzureDevOps
- [ ] Tests hooks

### State Management
- [ ] Zustand stores créés
- [ ] React Query setup
- [ ] Queries définies
- [ ] Mutations définies

### Build
- [ ] Vite configuration
- [ ] Build production
- [ ] Package .vsix
- [ ] Tests E2E

---

## 📊 Métriques de Succès

### Performance
- **Build time** : 30s → < 3s ✅
- **HMR** : 3s → < 100ms ✅
- **Bundle size** : -30% (tree shaking)

### Quality
- **Type safety** : 100% (strict mode)
- **Test coverage** : > 80%
- **Zero console errors**

### Developer Experience
- **Fast refresh** instantané
- **TypeScript intellisense** partout
- **DevTools** pour debug

---

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm run test
npm run test:ui
npm run test:coverage

# Linting & Formatting
npm run lint
npm run format

# Package
npm run package
```

---

## ⚠️ Points d'Attention

1. **Azure DevOps SDK** : Pas de changement, toujours compatible
2. **azure-devops-ui** : Peut nécessiter des ajustements CSS
3. **Compatibilité IE11** : Non supporté (ok pour Azure DevOps moderne)
4. **Tests** : Mocker correctement Azure DevOps SDK

---

## 📚 Documentation

- [ARCHITECTURE_MODERNE.md](./ARCHITECTURE_MODERNE.md) - Architecture détaillée
- [src-modern-examples/](./src-modern-examples/) - Exemples de code
- [Vite Documentation](https://vitejs.dev/)
- [React Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
