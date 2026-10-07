/**
 * Hook for Azure DevOps dialog management
 */
import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';

export interface DialogSize {
  width: number;
  height: number;
}

/**
 * The host ignores width/height passed to openCustomDialog, so the dialog
 * content asks for its own size. Keep a margin so it fits on small screens.
 */
function fitToScreen({ width, height }: DialogSize): DialogSize {
  const screenWidth = window.screen?.availWidth || width;
  const screenHeight = window.screen?.availHeight || height;
  return {
    width: Math.max(360, Math.min(width, screenWidth - 120)),
    height: Math.max(320, Math.min(height, screenHeight - 240)),
  };
}

export function useAzureDialog<T = any>(size?: DialogSize) {
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
        await SDK.notifyLoadSucceeded();

        if (size) {
          const { width, height } = fitToScreen(size);
          SDK.resize(width, height);
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
  };
}
