/**
 * Service IDs for Azure DevOps SDK services
 * These are hardcoded to avoid AMD module loading issues with azure-devops-extension-api
 */
export const ServiceIds = {
  ExtensionDataService: 'ms.vss-features.extension-data-service',
  GlobalMessagesService: 'ms.vss-tfs-web.tfs-global-messages-service',
  HostDialogService: 'ms.vss-features.host-dialog-service',
  HostNavigationService: 'ms.vss-features.host-navigation-service',
  HostPageLayoutService: 'ms.vss-features.host-page-layout-service',
  LocationService: 'ms.vss-features.location-service',
  ProjectPageService: 'ms.vss-tfs-web.tfs-page-data-service',
} as const;

/**
 * Work Item Tracking Service IDs
 */
export const WorkItemServiceIds = {
  WorkItemFormService: 'ms.vss-work-web.work-item-form',
} as const;
