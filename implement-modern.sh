#!/bin/bash

# Script pour implémenter l'architecture moderne
# en copiant et adaptant les fichiers existants

set -e

SRC_OLD="src"
SRC_NEW="src-modern"

echo "🚀 Starting modern architecture implementation..."

# Copier et adapter les fichiers utilitaires
echo "📁 Copying utility files..."
mkdir -p $SRC_NEW/core/utils

# Copier SettingsUpgrade (déjà adapté dans les exemples)
cp $SRC_OLD/settings/SettingsUpgrade.ts $SRC_NEW/core/utils/settings-upgrade.ts

# Copier ChildTasksService pour adaptation
cp $SRC_OLD/extension/ChildTasksService.ts $SRC_NEW/core/services/childTasks.service.ts

# Copier SettingsData pour adaptation  
cp $SRC_OLD/settings/SettingsData.ts $SRC_NEW/core/services/settings.service.ts

# Copier les composants React pour adaptation
mkdir -p $SRC_NEW/features/template-selector/components
cp $SRC_OLD/chooseTemplatePanel/ChooseTemplatePanel.tsx $SRC_NEW/pages/ChooseTemplatePage.tsx
cp $SRC_OLD/chooseTemplatePanel/TemplateSelect.tsx $SRC_NEW/features/template-selector/components/
cp $SRC_OLD/chooseTemplatePanel/TemplateSelectItem.tsx $SRC_NEW/features/template-selector/components/

# Copier settings pour adaptation
mkdir -p $SRC_NEW/features/template-editor/components
cp $SRC_OLD/settings/settings.ts $SRC_NEW/pages/SettingsPage.tsx

# Copier extension.ts
cp $SRC_OLD/extension/extension.ts $SRC_NEW/pages/ExtensionPage.ts

# Copier SCSS
mkdir -p $SRC_NEW/styles
cp $SRC_OLD/chooseTemplatePanel/chooseTemplatePanel.scss $SRC_NEW/styles/ 2>/dev/null || true
cp $SRC_OLD/settings/settings.scss $SRC_NEW/styles/ 2>/dev/null || true

echo "✅ Files copied successfully!"
echo "📝 Total files in src-modern: $(find $SRC_NEW -type f | wc -l)"

