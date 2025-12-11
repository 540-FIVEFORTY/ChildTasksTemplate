/**
 * Hook for Azure DevOps dialog management
 */
import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';

export function useAzureDialog<T = any>() {
  const [context, setContext] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDialog = async () => {
      try {
        // Initialize SDK for dialog
        await SDK.init({ applyTheme: true, loaded: false });
        await SDK.ready();

        // Get the configuration passed to the dialog
        const config = SDK.getConfiguration();
        console.log('[useAzureDialog] Configuration:', config);

        // The context is passed directly in the configuration object
        // from openCustomDialog({ configuration: context })
        if (config) {
          setContext(config);
        }

        setIsReady(true);
        SDK.notifyLoadSucceeded();
      } catch (error) {
        console.error('[useAzureDialog] Failed to initialize:', error);
      }
    };

    initDialog();
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
    isReady,
  };
}
