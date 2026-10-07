/**
 * Extension entry point - "Add tasks" menu action
 */
console.log('[Extension] Module loading started...');

import * as SDK from 'azure-devops-extension-sdk';
import { ServiceIds } from '@core/constants/service-ids';

// Host page layout service (not imported from azure-devops-extension-api to
// avoid its AMD modules).
interface IHostPageLayoutService {
  openPanel(contributionId: string, options?: any): void;
}

// PanelSize.Large from azure-devops-extension-api (a const enum).
const PANEL_SIZE_LARGE = 2;

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
          const layoutService = await SDK.getService<IHostPageLayoutService>(
            ServiceIds.HostPageLayoutService
          );

          // Get extension context to build contribution ID
          const extensionContext = SDK.getExtensionContext();
          const chooseContributionId = `${extensionContext.publisherId}.${extensionContext.extensionId}.child-tasks-template-choose`;
          console.log('[Extension] Opening panel with contribution:', chooseContributionId);

          // A full-height side panel, as in 2.x: a host dialog keeps a fixed
          // width and is too small for the template list.
          layoutService.openPanel(chooseContributionId, {
            title: 'Add child tasks',
            size: PANEL_SIZE_LARGE,
            configuration: context,
          });
        } catch (error) {
          console.error('[Extension] Failed to open panel:', error);
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
