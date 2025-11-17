/**
 * Choose Template Panel entry point
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../config/query-client';
import { TemplateSelectorPanel } from '../features/template-selector/components/TemplateSelectorPanel';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TemplateSelectorPanel />
      </QueryClientProvider>
    </StrictMode>
  );
}
