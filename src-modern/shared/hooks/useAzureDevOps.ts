/**
 * Azure DevOps SDK hooks
 */
import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import type {
  IProjectPageService,
  IHostPageLayoutService,
} from 'azure-devops-extension-api';

import { ServiceIds } from '@core/constants/service-ids';

/**
 * Initialize Azure DevOps SDK
 */
export function useAzureSDK() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SDK.init({ applyTheme: true, loaded: false })
      .then(() => SDK.ready())
      .then(() => {
        setIsReady(true);
        SDK.notifyLoadSucceeded();
      })
      .catch((error) => {
        console.error('Failed to initialize Azure DevOps SDK:', error);
      });
  }, []);

  return { isReady };
}

/**
 * Get current project
 */
export async function getCurrentProject() {
  const projectService = await SDK.getService<IProjectPageService>(
    ServiceIds.ProjectPageService
  );
  return projectService.getProject();
}

/**
 * Get page layout service
 */
export async function getPageLayoutService() {
  return SDK.getService<IHostPageLayoutService>(
    ServiceIds.HostPageLayoutService
  );
}
