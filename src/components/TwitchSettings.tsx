
import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface TwitchSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const TwitchSettings: React.FC<TwitchSettingsProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [useHardcodedKeys, setUseHardcodedKeys] = useState(false);
  const [isPublicClient, setIsPublicClient] = useState(false);

  useEffect(() => {
    // Load saved preferences if they exist
    const savedClientId = localStorage.getItem('twitch_client_id');
    const savedClientSecret = localStorage.getItem('twitch_client_secret');
    const savedUseHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const savedIsPublicClient = localStorage.getItem('is_public_client') === 'true';
    
    if (savedClientId) setClientId(savedClientId);
    if (savedClientSecret) setClientSecret(savedClientSecret);
    setUseHardcodedKeys(savedUseHardcodedKeys);
    setIsPublicClient(savedIsPublicClient);
  }, [isOpen]);

  const handleSave = () => {
    if (useHardcodedKeys) {
      // If using hardcoded keys, just save the preference
      localStorage.setItem('use_hardcoded_keys', 'true');
      localStorage.removeItem('twitch_client_id');
      localStorage.removeItem('twitch_client_secret');
      localStorage.removeItem('is_public_client');
      toast.success('Using built-in Twitch API credentials');
    } else {
      // Otherwise require and save user-provided credentials
      if (!clientId) {
        toast.error('Client ID is required');
        return;
      }

      // Client Secret is only required if not using a public client
      if (!isPublicClient && !clientSecret) {
        toast.error('Client Secret is required for confidential clients');
        return;
      }

      // Save to localStorage
      localStorage.setItem('twitch_client_id', clientId);
      localStorage.setItem('is_public_client', isPublicClient.toString());
      localStorage.setItem('use_hardcoded_keys', 'false');
      
      if (isPublicClient) {
        // For public clients, we can clear the secret
        localStorage.removeItem('twitch_client_secret');
      } else {
        localStorage.setItem('twitch_client_secret', clientSecret);
      }
      
      toast.success('Twitch API credentials saved');
    }
    
    // Call the onSettingsSaved callback if provided
    if (onSettingsSaved) {
      onSettingsSaved();
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <CardTitle>Twitch API Settings</CardTitle>
          <CardDescription>
            Enter your Twitch API credentials to connect to the service
          </CardDescription>
          <Button 
            variant="minimal" 
            className="absolute top-4 right-4" 
            onClick={onClose}
            size="icon"
          >
            <X size={18} />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="flex items-center justify-between mb-4 p-2 bg-secondary/50 rounded-md">
              <div>
                <h3 className="text-sm font-medium">Use built-in API key</h3>
                <p className="text-xs text-muted-foreground">
                  Use the application's built-in Twitch API credentials
                </p>
              </div>
              <Switch 
                checked={useHardcodedKeys} 
                onCheckedChange={setUseHardcodedKeys}
              />
            </div>

            {!useHardcodedKeys && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="client-id">
                    Client ID
                  </label>
                  <input
                    id="client-id"
                    type="text"
                    className="w-full p-2 rounded-md border border-border"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Twitch Client ID"
                  />
                </div>
                
                <div className="flex items-center justify-between mb-4 p-2 bg-secondary/50 rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">Public Client</h3>
                    <p className="text-xs text-muted-foreground">
                      My application is registered as a "Public" client type
                    </p>
                  </div>
                  <Switch 
                    checked={isPublicClient} 
                    onCheckedChange={setIsPublicClient}
                  />
                </div>
                
                {!isPublicClient && (
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="client-secret">
                      Client Secret
                    </label>
                    <input
                      id="client-secret"
                      type="password"
                      className="w-full p-2 rounded-md border border-border"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Enter your Twitch Client Secret"
                    />
                  </div>
                )}
              </>
            )}

            <div className="pt-2 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Settings
              </Button>
            </div>
          </form>

          {!useHardcodedKeys && (
            <div className="mt-4 text-xs text-muted-foreground">
              <p>To get your Twitch API credentials:</p>
              <ol className="list-decimal ml-5 mt-1 space-y-1">
                <li>Go to <a href="https://dev.twitch.tv/console" target="_blank" rel="noopener noreferrer" className="text-primary underline">Twitch Developer Console</a></li>
                <li>Register a new application</li>
                <li>Set the redirect URL to <code>http://localhost</code></li>
                <li>Copy the Client ID from your registered application</li>
                <li>For Confidential clients only: Generate and copy a Client Secret</li>
              </ol>
              <div className="flex items-start gap-2 mt-2 p-2 bg-blue-500/10 rounded-md">
                <Info size={16} className="mt-0.5 text-blue-500 flex-shrink-0" />
                <p>
                  Note: Public client applications only need a Client ID. If your application is registered as a "Public" client, toggle the "Public Client" switch and you won't need to provide a Client Secret.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TwitchSettings;
