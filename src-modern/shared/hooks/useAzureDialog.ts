/**
 * Hook for Azure DevOps dialog management
 */
import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';

export interface DialogSize {
  height: number;
}

/**
 * The host ignores width/height passed to openCustomDialog, so the dialog
 * content asks for its own height. The width is fixed by the host and the
 * content fits it. Keep a margin so the dialog fits on small screens.
 */
function fitHeightToScreen(height: number): number {
  const screenHeight = window.screen?.availHeight || height;
  return Math.max(320, Math.min(height, screenHeight - 240));
}

export function useAzureDialog<T = any>(size?: DialogSize) {
  const [context, setContext] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  // Panels come with their own title bar, close button and full height.
  const [isPanel, setIsPanel] = useState(false);

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
          setIsPanel(Boolean(config.panel) && !config.dialog);
        }

        setIsReady(true);
        await SDK.notifyLoadSucceeded();

        if (size && config?.dialog) {
          // Keep the width the host gave the dialog: it cannot be changed.
          SDK.resize(
            document.documentElement.clientWidth || undefined,
            fitHeightToScreen(size.height)
          );
        }
      } catch (error) {
        console.error('[useAzureDialog] Failed to initialize:', error);
      }
    };

    initDialog();
  }, [size]);

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
    isPanel,
  };
}
