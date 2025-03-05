
import React, { useState, useEffect } from 'react';
import { X, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { clearAuthToken } from '../utils/twitchApi';

interface TwitchSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const TwitchSettings: React.FC<TwitchSettingsProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [useHardcodedKeys, setUseHardcodedKeys] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedClientId = localStorage.getItem('twitch_client_id');
    const savedClientSecret = localStorage.getItem('twitch_client_secret');
    const hasSecret = !!savedClientSecret;
    
    // If user has saved credentials, default to using those
    if (hasSecret) {
      setUseHardcodedKeys(false);
    } else {
      setUseHardcodedKeys(true);
    }
    
    if (savedClientId) setClientId(savedClientId);
    if (savedClientSecret) setClientSecret(savedClientSecret);
    
    // Check if we've successfully connected before
    setIsSuccessful(hasSecret);
  }, [isOpen]);

  const handleSave = async () => {
    // Clear existing auth token to force refresh with new credentials
    clearAuthToken();
    
    if (useHardcodedKeys) {
      // If using hardcoded keys, clear any user provided credentials
      localStorage.removeItem('twitch_client_id');
      localStorage.removeItem('twitch_client_secret');
      toast.info('Using built-in Twitch API credentials (demo mode only)');
      setIsSuccessful(false);
    } else {
      // Otherwise require and save user-provided credentials
      if (!clientId) {
        toast.error('Client ID is required');
        return;
      }

      if (!clientSecret) {
        toast.error('Client Secret is required');
        return;
      }

      // Test connection before saving
      if (!isTestingConnection) {
        try {
          setIsTestingConnection(true);
          toast.info('Testing connection to Twitch API...');
          
          // Set temporary values for testing
          localStorage.setItem('twitch_client_id', clientId);
          localStorage.setItem('twitch_client_secret', clientSecret);
          
          // Try to get a token
          const testModule = await import('../utils/twitchApi');
          await testModule.getTwitchAuthToken();
          
          toast.success('Connection to Twitch API successful!');
          setIsSuccessful(true);
          
          // Save to localStorage
          localStorage.setItem('twitch_client_id', clientId);
          localStorage.setItem('twitch_client_secret', clientSecret);
        } catch (error) {
          console.error('Connection test error:', error);
          toast.error('Failed to connect to Twitch API. Please check your credentials.');
          setIsTestingConnection(false);
          setIsSuccessful(false);
          return;
        }
        setIsTestingConnection(false);
      }
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
            Configure how the app connects to Twitch
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
          {isSuccessful ? (
            <div className="mb-4 p-3 bg-green-500/10 rounded-md border border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                <Info className="h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>Connected:</strong> Using your Twitch API credentials to access real-time data.
                </span>
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                <Info className="h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>Not Connected:</strong> To see real-time Twitch clips, you need to provide your own Twitch API credentials.
                </span>
              </p>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="flex items-center justify-between mb-4 p-2 bg-secondary/50 rounded-md">
              <div>
                <h3 className="text-sm font-medium">Use built-in API key</h3>
                <p className="text-xs text-muted-foreground">
                  {isSuccessful 
                    ? "Switch to using the built-in credentials (demo mode only)"
                    : "Use the application's built-in credentials (demo mode only)"}
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
              </>
            )}

            <div className="pt-2 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isTestingConnection}>
                {useHardcodedKeys ? "Use Demo Mode" : "Save Settings"}
              </Button>
            </div>
          </form>

          {!useHardcodedKeys && (
            <div className="mt-4 text-xs text-muted-foreground">
              <p>To get your Twitch API credentials:</p>
              <ol className="list-decimal ml-5 mt-1 space-y-1">
                <li>Go to <a href="https://dev.twitch.tv/console" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Twitch Developer Console <ExternalLink className="h-3 w-3" /></a></li>
                <li>Register a new application</li>
                <li>Set the OAuth Redirect URL to <code>http://localhost</code></li>
                <li>Set the Category to "Website Integration"</li>
                <li>Copy the Client ID from your registered application</li>
                <li>Generate a Client Secret and copy it</li>
              </ol>
              <div className="flex items-start gap-2 mt-3 p-2 bg-blue-500/10 rounded-md">
                <Info size={16} className="mt-0.5 text-blue-500 flex-shrink-0" />
                <p>
                  Note: The built-in credentials can only access demo/mock data. To see real Twitch clips, you must use your own Twitch API credentials.
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
