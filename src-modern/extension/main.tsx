/**
 * Extension entry point - "Add tasks" menu action
 */
console.log('[Extension] Module loading started...');

import * as SDK from 'azure-devops-extension-sdk';
import { ServiceIds } from '@core/constants/service-ids';

// Dialog service interface (not exported from azure-devops-extension-api)
interface IHostDialogService {
  openCustomDialog(contributionId: string, options?: any): Promise<any>;
}

console.log('[Extension] SDK imported');

// Initialize and register extension
async function init() {
  console.log('[Extension] init() starting...');
  try {
    await SDK.init({ applyTheme: true, loaded: false });
    console.log('[Extension] SDK.init() completed');

    await SDK.ready();
    console.log('[Extension] SDK.ready() completed');

    // Register the extension action
    const contributionId = SDK.getContributionId();
    console.log('[Extension] Contribution ID:', contributionId);

    SDK.register(contributionId, () => ({
      execute: async (context: any) => {
        console.log('[Extension] Execute called with context:', context);

        try {
          // Get the dialog service
          const dialogService = await SDK.getService<IHostDialogService>(
            ServiceIds.HostDialogService
          );
          console.log('[Extension] Dialog service obtained');

          // Get extension context to build contribution ID
          const extensionContext = SDK.getExtensionContext();
          const chooseContributionId = `${extensionContext.publisherId}.${extensionContext.extensionId}.child-tasks-template-choose`;
          console.log('[Extension] Opening dialog with contribution:', chooseContributionId);

          // Open the choose template dialog
          await dialogService.openCustomDialog(chooseContributionId, {
            title: 'Add Child Tasks',
            configuration: context,
            resizable: true,
            modal: true,
            width: 500,
            height: 400,
          });

          console.log('[Extension] Dialog opened successfully');
        } catch (error) {
          console.error('[Extension] Failed to open dialog:', error);
        }
      },
    }));
    console.log('[Extension] Extension registered');

    await SDK.notifyLoadSucceeded();
    console.log('[Extension] notifyLoadSucceeded() completed');
  } catch (error) {
    console.error('[Extension] init() failed:', error);
    throw error;
  }
}

console.log('[Extension] Calling init()...');
init().catch((error) => {
  console.error('[Extension] init() promise rejected:', error);
});
