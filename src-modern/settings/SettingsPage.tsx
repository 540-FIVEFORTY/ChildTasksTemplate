/**
 * Settings Page - Template Editor
 */
import { useEffect, useState } from 'react';
import { Button } from 'azure-devops-ui/Button';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';

import { useAzureSDK } from '../shared/hooks';
import { templateService } from '../core/services';

export function SettingsPage() {
  const { isReady } = useAzureSDK();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (isReady) {
      loadSetup();
    }
  }, [isReady]);

  const loadSetup = async () => {
    try {
      const data = await templateService.getTemplateSetup();
      setJsonText(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to load setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const parsed = JSON.parse(jsonText);
      await templateService.saveTemplateSetup(parsed);
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save template: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spinner size={SpinnerSize.large} label="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Child Tasks Template Configuration</h2>
      <p>Edit the JSON configuration below:</p>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        style={{
          width: '100%',
          height: '500px',
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '10px',
        }}
      />

      <div style={{ marginTop: '20px' }}>
        <Button
          text={isSaving ? 'Saving...' : 'Save'}
          primary
          onClick={handleSave}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}
