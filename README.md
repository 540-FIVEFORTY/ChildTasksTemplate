# Child Tasks Template - Azure DevOps Extension

[![Build Status](https://dev.azure.com/fiveforty/DevOps/_apis/build/status/ChildTaskTemplate?branchName=master)](https://dev.azure.com/fiveforty/DevOps/_build/latest?definitionId=17&branchName=master)

This Azure DevOps extension enables creating child tasks from predefined templates directly from work items (User Stories, Bugs, etc.).

## 🔔 What's New in 3.0.34

Incremental improvements to the template editor and field configuration since the 3.0.24 modern-architecture release:

### Template Editor UX
- 🖥️ Wider, full-width template configuration that stays visible while editing
- 🎛️ Explicit, clearer template editor controls
- 🔽 Field dropdowns remain usable inside the editor

### Field Configuration & Hints
- 🔢 Inline decimal examples in field hints
- 📅 Inline date examples in field hints
- 🗓️ Date-like fields are detected and treated as dates
- 💾 Hardened field hints and clearer save feedback

### Validation & Reliability
- 🛡️ Invalid template fields are blocked before saving
- 🧪 Hardened ChildTasks private testing workflow

## 🏗️ Modern Architecture (since 3.0.0)

The extension ships the modern Azure DevOps build from `src-modern/`:

### Major Changes

- ⚡ **Build Tool**: Migrated from Webpack 5 to **Vite 6.0.1** (15x faster builds, 30x faster HMR)
- ⚛️ **React**: Upgraded from React 16.8 (Class Components) to **React 18.3.1** (Functional Components + Hooks)
- 📘 **TypeScript**: Enabled strict mode with enhanced type safety
- 🏗️ **Architecture**: Feature-based folder structure with layered architecture
- 🔄 **State Management**:
  - **Zustand 5.0.1** for client state
  - **TanStack Query 5.59.0** for server state and data fetching
- 🧪 **Testing**: **Vitest 2.1.6** + Testing Library ready to use
- 📦 **Code Splitting**: Optimized vendor chunks for better performance

### Performance Improvements

| Metric | Webpack 5 | Vite 6 | Improvement |
|--------|-----------|--------|-------------|
| Production Build | ~30s | ~2s | **15x faster** |
| Dev Server Start | ~15s | ~500ms | **30x faster** |
| HMR Update | ~2s | ~50ms | **40x faster** |

## 📁 Project Structure

```
ChildTasksTemplate/
├── src-modern/                    # Modern architecture source code
│   ├── core/                      # Core business logic
│   │   ├── models/               # TypeScript interfaces (Field, Task, Template)
│   │   ├── services/             # Service layer (data access)
│   │   └── utils/                # Utilities and helpers
│   ├── features/                 # Feature modules
│   │   ├── template-selector/   # Template selection feature
│   │   ├── template-editor/     # Template editor with Zustand store
│   │   └── task-creation/       # Task creation logic
│   ├── shared/                   # Shared components and hooks
│   │   └── hooks/               # Custom React hooks
│   ├── config/                   # Configuration files
│   ├── extension/                # Main extension entry point
│   ├── chooseTemplate/          # Template chooser dialog
│   └── settings/                # Settings page
├── doc/                          # Documentation and screenshots
├── scripts/                      # Build and utility scripts
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── vss-extension.json           # Azure DevOps extension manifest
```

### Architecture Layers

1. **Presentation Layer** (`features/*/components/`)
   - React 18 functional components with hooks
   - Azure DevOps UI components
   - SCSS styling

2. **Business Logic Layer** (`features/*/hooks/`, `features/*/store/`)
   - Custom hooks for business logic
   - Zustand stores for state management
   - TanStack Query for data fetching

3. **Data Access Layer** (`core/services/`)
   - Service classes for Azure DevOps API interaction
   - Template CRUD operations
   - Settings persistence

## 🛠️ Technologies

### Core Stack
- **React 18.3.1** - UI framework with concurrent features
- **TypeScript 5.6.3** - Strict mode enabled
- **Vite 6.0.1** - Build tool and dev server
- **Azure DevOps Extension SDK 4.2.0** - Extension framework

### State Management & Data
- **Zustand 5.0.1** - Lightweight state management
- **TanStack Query 5.59.0** - Server state management
- **Immer 10.1.1** - Immutable state updates

### UI Components
- **Azure DevOps UI 2.167.97** - Official UI component library
- **Monaco Editor 4.6.0** - Code editor (ready for JSON editing)

### Testing
- **Vitest 2.1.6** - Fast unit test runner
- **Testing Library 16.1.0** - React component testing
- **@vitest/coverage-v8** - Code coverage

### Development Tools
- **ESLint 9.15.0** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## 📦 Installation & Setup

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Git**

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ChildTasksTemplate

# Install dependencies
npm install
```

## 🚀 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Create .vsix package
npm run package

# Clean build artifacts
npm run clean
```

### Development Workflow

1. **Start dev server**:
   ```bash
   npm run dev
   ```
   Access at `https://localhost:6221`

2. **Make changes** - Hot Module Replacement will update automatically

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📦 Building and Packaging

### Create Extension Package

```bash
# Build and create .vsix file
npm run package
```

This will:
1. Compile TypeScript
2. Bundle with Vite (production mode)
3. Copy documentation assets
4. Create `bin/Fiveforty.ChildTasksTemplate-3.0.34.vsix`

### Upload to Marketplace

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Upload the `.vsix` file from `bin/` directory
3. Publish to your organization or make public

## 🎯 Features

### 1. Template Configuration
- **Location**: Project Settings > Child Tasks Template
- Define multiple templates with custom fields
- Visual editor plus JSON-based configuration with schema validation
- Add a new template by pasting JSON directly in the modern editor
- Supports field interpolation using parent work item data

### 2. Add Tasks Action
- **Available from**:
  - Work item context menu
  - Work item toolbar
  - Backlog item menu
  - Query result menu
- Select one or multiple templates
- Creates child tasks with predefined values

### 3. Field Interpolation
- Use `{fieldName}` syntax to reference parent work item fields
- Example: `{System.Title}` inserts parent work item title
- Supports nested fields: `{Custom.TeamName}`

### 4. Locale Support
- Handles locale-specific number formatting
- Preserves field values as strings (fixes 8h → 80h bug)
- French comma notation support (8,5h)

### 5. Project-Aware Field Metadata
- Field suggestions are loaded from Azure DevOps project metadata
- Suggestions adapt to the selected child work item type
- Already-used fields in the current task are filtered out from the field picker
- Picklist fields can expose their allowed values in the value suggestions

## 🔧 Configuration

### Template Schema

Templates are configured in JSON format:

```json
{
  "version": 3,
  "templates": [
    {
      "name": "Development Tasks",
      "tasks": [
        {
          "name": "Code Review for {System.Title}",
          "fields": [
            {
              "name": "System.Title",
              "value": "Code Review for {System.Title}"
            },
            {
              "name": "Microsoft.VSTS.Scheduling.OriginalEstimate",
              "value": "2"
            },
            {
              "name": "System.AssignedTo",
              "value": "{System.AssignedTo}"
            }
          ]
        }
      ]
    }
  ]
}
```

See [Template Schema Sample](src-modern/core/utils/templateSetupSample.json) for complete example.

## 🔄 Migration from Version 2.x

### Breaking Changes

1. **Build Output Location**
   - Old: `dist/*.html` (flat structure)
   - New: `dist/src-modern/*/index.html` (organized structure)

2. **Entry Points**
   - Extension: `dist/src-modern/extension/index.html`
   - Settings: `dist/src-modern/settings/index.html`
   - Choose Template: `dist/src-modern/chooseTemplate/index.html`

### Data Migration

Legacy stored template data is upgraded to the current schema on load. The modern service also reads the previous project settings key and migrates it forward automatically when legacy data is found.

### Configuration Files

If you have custom webpack configurations or build scripts, they need to be updated for Vite:

- `webpack.config.js` → `vite.config.ts`
- Update npm scripts in `package.json`

## 🐛 Recent Fixes

### Original Estimate Bug (8h → 80h)

**Issue**: JSON editor was converting "8h" to number 8, then to "80" in some locales (French).

**Fix**: the modern extension preserves template field values as strings in settings and normalizes numeric Azure DevOps work item fields only at creation time:
- Settings normalization: `src-modern/core/utils/settings-upgrade.ts`
- Task creation normalization: `src-modern/core/services/childTasks.service.ts`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
src-modern/
├── **/*.test.ts          # Unit tests
└── **/*.test.tsx         # Component tests
```

## 📚 Documentation

- [Detailed Extension Documentation](content_details.md)
- [Architecture Documentation](ARCHITECTURE_MODERNE.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
- [Migration Guide](MIGRATION_GUIDE.md) *(if created)*

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **TypeScript**: Use strict mode, avoid `any` types
3. **Components**: Use functional components with hooks
4. **State**: Use Zustand for client state, TanStack Query for server state
5. **Testing**: Write tests for new features
6. **Commits**: Use conventional commits format

### Commit Message Format

```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Marketplace**: [Child Tasks Template](https://marketplace.visualstudio.com/items?itemName=Fiveforty.ChildTasksTemplate)
- **Repository**: [GitHub](https://github.com/dbru540/ChildTasksTemplate)
- **Issues**: [Report Issues](https://github.com/dbru540/ChildTasksTemplate/issues)
- **Support**: dbru@fiveforty.fr

## 🙏 Acknowledgments

Built with:
- [Azure DevOps Extension SDK](https://github.com/Microsoft/azure-devops-extension-sdk)
- [Azure DevOps Extension API](https://github.com/Microsoft/azure-devops-extension-api)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Version 3.0.34** - Modern Architecture with Vite + React 18 - © 2026 Fiveforty
