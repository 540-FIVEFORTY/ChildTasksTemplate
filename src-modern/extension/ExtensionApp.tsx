/**
 * Extension App Component - handles the "Add tasks" action
 */
import { useEffect } from 'react';
import { useAzureSDK } from '../shared/hooks';

export function ExtensionApp() {
  const { isReady } = useAzureSDK();

  useEffect(() => {
    if (isReady) {
      // Extension is ready - the dialog will be shown by Azure DevOps
      // when user clicks "Add tasks"
      console.log('Extension app ready');
    }
  }, [isReady]);

  return null; // This component doesn't render anything
}
