# Guide de Correction Rapide

## 🎯 Objectif
Corriger les ~50 erreurs de compilation TypeScript pour obtenir un build fonctionnel.

---

## ⚡ Actions Rapides (30 min)

### 1. Installer pupa
```bash
npm install --save pupa
```

### 2. Supprimer fichiers obsolètes
```bash
rm -rf src-modern/pages/
```

### 3. Corriger useTemplateSelection.ts
```typescript
// src-modern/features/template-selector/hooks/useTemplateSelection.ts

// Ligne 9 : Changer
export interface UseTemplateSelectionReturn {
  templates: string[];  // ✅ string[] au lieu de Template[]
  selectedTemplateNames: string[];
  selectedTemplates: string[];  // ✅ string[] aussi
  // ...
}

// Ligne 65 : Changer
const selectAll = useCallback(() => {
  setSelectedNames(new Set(templates));  // ✅ templates est déjà string[]
}, [templates]);

// Lignes 86, 94, 96 : Supprimer .map(t => t.name) car templates est déjà string[]
const selectedTemplateNames = useMemo(
  () => Array.from(selectedNames),
  [selectedNames]
);

const selectedTemplates = useMemo(
  () => templates.filter((t) => selectedNames.has(t)),  // ✅ t est déjà une string
  [templates, selectedNames]
);
```

### 4. Corriger TemplateSelectorPanel.tsx
```typescript
// src-modern/features/template-selector/components/TemplateSelectorPanel.tsx

// Ligne 133 : templates est déjà string[]
<TemplateList
  templates={templates}  // ✅ Pas besoin de transformation
  onToggle={toggleTemplate}
  isSelected={isSelected}
/>
```

### 5. Corriger les imports d'enums
Remplacer tous les usages de `CommonServiceIds` par des strings :

```typescript
// ❌ Avant
import { CommonServiceIds } from 'azure-devops-extension-api';
const service = await SDK.getService<T>(CommonServiceIds.ProjectPageService);

// ✅ Après  
const service = await SDK.getService<T>('ms.vss-tfs-web.tfs-page-data-service');
```

Ou désactiver `isolatedModules` dans tsconfig.json :
```json
{
  "compilerOptions": {
    "isolatedModules": false  // ✅ Permet d'utiliser les enums
  }
}
```

### 6. Corriger childTasks.service.ts
```typescript
// Ligne 121 : Typer Error
catch (error: any) {  // ✅ ou Error avec assertion
  console.error("Error:", error.message);
}

// Lignes 124-141 : Typer obj
private static setFieldValue(obj: Record<string, any>, fieldName: string, value: any) {
  // ...
}
```

### 7. Corriger settings.service.ts
```typescript
// Corriger les imports en haut du fichier
import { SettingsUpgrade } from '../utils/settings-upgrade';
import type { Template } from '../models/Template';
import type { TemplateSetup } from '../models/TemplateSetup';
```

### 8. Build
```bash
npm run build
```

---

## 🔧 Si ça ne marche toujours pas

### Option A : Mode Permissif Temporaire
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false,  // Temporaire
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "isolatedModules": false
  }
}
```

### Option B : Utiliser l'ancien tsconfig
```bash
mv tsconfig.json tsconfig.strict-backup
mv tsconfig.json.old-backup tsconfig.json
npm run build
```

---

## ✅ Vérification

```bash
# Build réussi ?
npm run build

# Fichiers générés ?
ls -la dist/

# 3 fichiers HTML + 3 fichiers JS minimum
# extension.html, extension.js
# settings.html, settings.js
# chooseTemplate.html, chooseTemplate.js
```

---

## 📦 Créer le Package

```bash
npm run package

# Vérifier
ls -la bin/
# Devrait contenir: Fiveforty.ChildTasksTemplate-3.0.0.vsix
```

---

## 🎉 Succès!

Si le build réussit et le .vsix est créé, vous avez une implémentation moderne fonctionnelle !

**Prochaines étapes** :
1. Tester l'extension dans Azure DevOps
2. Corriger les bugs UI si nécessaire
3. Ajouter les tests
4. Déployer
