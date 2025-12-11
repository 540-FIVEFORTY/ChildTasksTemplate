/**
 * Settings Page entry point
 */
console.log('[Settings] Module loading started...');

import { StrictMode } from 'react';
console.log('[Settings] React imported');

import { createRoot } from 'react-dom/client';
console.log('[Settings] ReactDOM imported');

import { QueryClientProvider } from '@tanstack/react-query';
console.log('[Settings] React Query imported');

import { queryClient } from '../config/query-client';
console.log('[Settings] Query client imported');

import { SettingsPage } from './SettingsPage';
console.log('[Settings] SettingsPage imported');

console.log('[Settings] Looking for root container...');
const container = document.getElementById('root');
if (container) {
  console.log('[Settings] Root container found, rendering app...');
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    </StrictMode>
  );
  console.log('[Settings] App rendered');
} else {
  console.error('[Settings] Root container not found!');
}
