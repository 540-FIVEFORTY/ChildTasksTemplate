/**
 * Choose Template Panel entry point
 */
console.log('[ChooseTemplate] Module loading started...');

import { StrictMode } from 'react';
console.log('[ChooseTemplate] React imported');

import { createRoot } from 'react-dom/client';
console.log('[ChooseTemplate] ReactDOM imported');

import { QueryClientProvider } from '@tanstack/react-query';
console.log('[ChooseTemplate] React Query imported');

import { queryClient } from '../config/query-client';
console.log('[ChooseTemplate] Query client imported');

import { TemplateSelectorPanel } from '../features/template-selector/components/TemplateSelectorPanel';
console.log('[ChooseTemplate] TemplateSelectorPanel imported');

console.log('[ChooseTemplate] Looking for root container...');
const container = document.getElementById('root');
if (container) {
  console.log('[ChooseTemplate] Root container found, rendering app...');
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TemplateSelectorPanel />
      </QueryClientProvider>
    </StrictMode>
  );
  console.log('[ChooseTemplate] App rendered');
} else {
  console.error('[ChooseTemplate] Root container not found!');
}
