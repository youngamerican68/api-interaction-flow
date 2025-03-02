
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { toast } from 'sonner';

interface TwitchSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TwitchSettings: React.FC<TwitchSettingsProps> = ({ isOpen, onClose }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Load saved credentials if they exist
    const savedClientId = localStorage.getItem('twitch_client_id');
    const savedClientSecret = localStorage.getItem('twitch_client_secret');
    
    if (savedClientId) setClientId(savedClientId);
    if (savedClientSecret) setClientSecret(savedClientSecret);
  }, [isOpen]);

  const handleSave = () => {
    if (!clientId || !clientSecret) {
      toast.error('Both Client ID and Client Secret are required');
      return;
    }

    // Save to localStorage
    localStorage.setItem('twitch_client_id', clientId);
    localStorage.setItem('twitch_client_secret', clientSecret);
    
    toast.success('Twitch API credentials saved');
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
            <div className="pt-2 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Settings
              </Button>
            </div>
          </form>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>To get your Twitch API credentials:</p>
            <ol className="list-decimal ml-5 mt-1 space-y-1">
              <li>Go to <a href="https://dev.twitch.tv/console" target="_blank" rel="noopener noreferrer" className="text-primary underline">Twitch Developer Console</a></li>
              <li>Register a new application</li>
              <li>Set the redirect URL to <code>http://localhost</code></li>
              <li>Copy the Client ID and generate a Client Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwitchSettings;
