
import { useState, useEffect } from "react";
import { Container } from "@/components/ui-custom/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { AnimatedText } from "@/components/ui-custom/AnimatedText";
import { Play, RefreshCw, Settings, TrendingUp, AlertCircle, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import TwitchSettings from "@/components/TwitchSettings";
import { detectViralMoments } from "@/utils/twitchApi";

interface ClipData {
  id: string;
  streamerName: string;
  viewerCount: number;
  chatActivity: number;
  clipUrl: string;
  thumbnailUrl: string;
  timestamp: string;
}

const ViralDetector = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<number | null>(null);
  const [viralClips, setViralClips] = useState<ClipData[]>([]);
  const [hasCredentials, setHasCredentials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingRealData, setFetchingRealData] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const checkCredentials = () => {
    localStorage.setItem('use_hardcoded_keys', 'true');
    localStorage.setItem('is_public_client', 'true');
    setHasCredentials(true);
    return true;
  };

  useEffect(() => {
    checkCredentials();
  }, []);

  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  const fetchViralMoments = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setFetchingRealData(true);
      setUsingMockData(false);
      
      const moments = await detectViralMoments();
      
      // Check if we're using mock data by looking at the ID format
      // Mock IDs typically start with "mock-viral-" or "demo-"
      const isMockData = moments.length > 0 && 
        (moments[0].id.startsWith('mock') || moments[0].id.startsWith('demo'));
      
      setUsingMockData(isMockData);
      
      if (moments.length > 0) {
        if (isMonitoring && viralClips.length > 0) {
          const newClips = moments.filter(
            newClip => !viralClips.some(existingClip => existingClip.id === newClip.id)
          );
          
          if (newClips.length > 0) {
            toast.success(`Detected ${newClips.length} new clips!`);
          }
        }
        
        setViralClips(moments);
        if (isMockData) {
          toast.info("Using demo clips - Twitch API authentication failed");
        } else {
          toast.success(`Found ${moments.length} viral clips from top streamers!`);
        }
      } else {
        toast.info("No viral clips found. Try again later.");
      }
    } catch (err) {
      console.error("Error fetching viral moments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch viral moments");
      toast.error("Error detecting viral moments");
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
      setFetchingRealData(false);
    }
  };

  const startMonitoring = () => {
    if (!hasCredentials) {
      setIsSettingsOpen(true);
      return;
    }
    
    setIsLoading(true);
    
    fetchViralMoments().then(() => {
      const intervalId = window.setInterval(fetchViralMoments, 2 * 60 * 1000);
      setMonitoringInterval(intervalId as unknown as number);
      setIsMonitoring(true);
      setIsLoading(false);
      toast.success("Monitoring started. Checking for viral clips every 2 minutes.");
    });
  };

  const stopMonitoring = () => {
    setIsLoading(true);
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    
    setIsMonitoring(false);
    setIsLoading(false);
    toast.info("Monitoring stopped");
  };

  const refreshData = () => {
    if (!hasCredentials) {
      setIsSettingsOpen(true);
      return;
    }
    
    fetchViralMoments();
  };

  const handleSettingsSaved = () => {
    checkCredentials();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-secondary/50 to-background">
      <main className="flex-grow py-8">
        <Container>
          <AnimatedText
            text="Twitch Viral Moment Detector"
            tag="h1"
            className="text-3xl md:text-4xl font-bold mb-4 text-center"
            animation="fade"
          />
          <AnimatedText
            text="Monitor Twitch streams to detect and capture viral moments automatically"
            tag="p"
            className="text-xl text-muted-foreground max-w-2xl mx-auto text-center mb-8"
            animation="fade"
            delay={0.1}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card variant="default" className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> 
                  Monitoring Status
                </CardTitle>
                <CardDescription>
                  {isMonitoring 
                    ? "Currently monitoring Twitch for viral moments" 
                    : "Start monitoring to detect viral moments"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {isMonitoring ? (
                    <Button 
                      onClick={stopMonitoring} 
                      variant="accent"
                      isLoading={isLoading}
                    >
                      Stop Monitoring
                    </Button>
                  ) : (
                    <Button 
                      onClick={startMonitoring}
                      isLoading={isLoading}
                      icon={<Play size={16} />}
                    >
                      Start Monitoring
                    </Button>
                  )}
                  <Button 
                    onClick={refreshData} 
                    variant="outline"
                    isLoading={isLoading}
                    icon={<RefreshCw size={16} />}
                  >
                    Refresh Data
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Settings size={16} />}
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Settings
                  </Button>
                </div>
                
                {error && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-green-500/10 rounded-md border border-green-500/20">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Connected:</strong> Using public Twitch API access to display clips from top streamers.
                  </p>
                </div>
                
                {usingMockData && (
                  <div className="mt-2 p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        <strong>Demo Mode:</strong> Currently showing demo clips because the Twitch API returned authentication errors. This is normal behavior when using the built-in credentials.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="default">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring Status</p>
                    <p className="font-medium">{isMonitoring ? "Active" : "Inactive"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Viral Moments Detected</p>
                    <p className="font-medium">{viralClips.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Detected</p>
                    <p className="font-medium">
                      {viralClips.length > 0 
                        ? formatTimestamp(viralClips[0].timestamp)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Source</p>
                    <p className="font-medium">{usingMockData ? "Demo Data" : "Live Twitch"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card variant="default">
            <CardHeader>
              <CardTitle>Detected Viral Moments</CardTitle>
              <CardDescription>
                {usingMockData 
                  ? "Demo clips for showcasing feature functionality" 
                  : "Real clips from detected viral moments on Twitch"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && viralClips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Fetching viral moments from Twitch...</p>
                  {fetchingRealData && (
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a moment as we're analyzing data from top streamers.
                    </p>
                  )}
                </div>
              ) : viralClips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viralClips.map((clip) => (
                    <Card key={clip.id} variant="outlined" hoverEffect>
                      <CardContent className="p-0">
                        <div className="relative aspect-video bg-black">
                          <iframe
                            src={clip.clipUrl}
                            allowFullScreen
                            title={`${clip.streamerName} clip`}
                            width="100%"
                            height="100%"
                            className="absolute inset-0"
                          ></iframe>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold truncate">{clip.streamerName}</h3>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(clip.clipUrl, '_blank')}
                              className="h-6 w-6"
                            >
                              <ExternalLink size={14} />
                            </Button>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>{formatTimestamp(clip.timestamp)}</span>
                            {usingMockData && <span className="text-xs italic">Demo</span>}
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <span>👁️ {clip.viewerCount.toLocaleString()}</span>
                            <span>💬 {clip.chatActivity}/s</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No viral moments detected yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Refresh Data" or "Start Monitoring" to detect viral moments on Twitch.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>
      
      <TwitchSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />
    </div>
  );
};

export default ViralDetector;
