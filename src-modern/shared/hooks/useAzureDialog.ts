/**
 * Hook for Azure DevOps dialog management
 */
import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';

export function useAzureDialog<T = any>() {
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const config = SDK.getConfiguration();
    if (config.dialog || config.panel) {
      setContext(config.context);
    }
  }, []);

  const close = (result: T) => {
    const config = SDK.getConfiguration();
    if (config.dialog) {
      config.dialog.close(result);
    } else if (config.panel) {
      config.panel.close(result);
    }
  };

  return {
    context,
    close,
  };
}
