/**
 * Extension entry point - "Add tasks" menu action
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SDK from 'azure-devops-extension-sdk';

import { queryClient } from '../config/query-client';
import { ExtensionApp } from './ExtensionApp';

// Initialize and register extension
async function init() {
  await SDK.init({ applyTheme: true, loaded: false });
  await SDK.ready();

  // Register the extension action
  SDK.register(SDK.getContributionId(), () => ({
    execute: async (context: any) => {
      // This will be handled by ExtensionApp
      (window as any).__extensionContext = context;
    },
  }));

  await SDK.notifyLoadSucceeded();
}

// Render app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ExtensionApp />
      </QueryClientProvider>
    </StrictMode>
  );
}

init().catch(console.error);
