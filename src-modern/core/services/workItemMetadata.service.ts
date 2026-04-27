import type { IProjectPageService } from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';

import { ServiceIds } from '@core/constants/service-ids';

export interface WorkItemTypeInfo {
  name: string;
  referenceName?: string;
  isDisabled?: boolean;
}

export interface WorkItemFieldInfo {
  name: string;
  referenceName: string;
  type?: string;
  alwaysRequired?: boolean;
  helpText?: string;
  allowedValues?: unknown[];
}

interface WorkItemTypesResponse {
  value: WorkItemTypeInfo[];
}

interface WorkItemFieldsResponse {
  value: WorkItemFieldInfo[];
}

export class WorkItemMetadataService {
  private baseUrl = '';
  private accessToken = '';
  private projectId = '';

  private async ensureInitialized(): Promise<void> {
    if (this.baseUrl && this.accessToken && this.projectId) {
      return;
    }

    const host = SDK.getHost();
    const projectService = await SDK.getService<IProjectPageService>(
      ServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();

    if (!project) {
      throw new Error('No project defined');
    }

    this.baseUrl = `https://dev.azure.com/${host.name}`;
    this.accessToken = await SDK.getAccessToken();
    this.projectId = project.id;
  }

  private async apiRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Metadata request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getWorkItemTypes(): Promise<WorkItemTypeInfo[]> {
    await this.ensureInitialized();

    const url = `${this.baseUrl}/${this.projectId}/_apis/wit/workitemtypes?api-version=7.1-preview.2`;
    const response = await this.apiRequest<WorkItemTypesResponse>(url);

    return response.value
      .filter((type) => !type.isDisabled)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async getFieldsForWorkItemType(
    workItemType: string
  ): Promise<WorkItemFieldInfo[]> {
    await this.ensureInitialized();

    const encodedType = encodeURIComponent(workItemType);
    const url = `${this.baseUrl}/${this.projectId}/_apis/wit/workitemtypes/${encodedType}/fields?$expand=all&api-version=7.1`;
    const response = await this.apiRequest<WorkItemFieldsResponse>(url);

    return response.value.sort((left, right) =>
      left.referenceName.localeCompare(right.referenceName)
    );
  }
}

export const workItemMetadataService = new WorkItemMetadataService();
