/**
 * Vitest test setup file
 */
import '@testing-library/jest-dom';

// Mock Azure DevOps SDK
vi.mock('azure-devops-extension-sdk', () => ({
  init: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  notifyLoadSucceeded: vi.fn(),
  register: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
  getHost: vi.fn().mockReturnValue({ name: 'test-org' }),
  getContributionId: vi.fn().mockReturnValue('test-contribution-id'),
  getService: vi.fn(),
  getExtensionContext: vi.fn().mockReturnValue({
    extensionId: 'test-extension',
    publisherId: 'test-publisher',
  }),
}));

// Mock Azure DevOps Extension API
vi.mock('azure-devops-extension-api', () => ({
  CommonServiceIds: {
    ProjectPageService: 'ms.vss-tfs-web.tfs-page-data-service',
    HostPageLayoutService: 'ms.vss-features.host-page-layout-service',
    ExtensionDataService: 'ms.vss-features.extension-data-service',
  },
  getClient: vi.fn(),
}));
