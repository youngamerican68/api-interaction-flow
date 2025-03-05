
import { useState, useEffect } from "react";
import { Container } from "@/components/ui-custom/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { AnimatedText } from "@/components/ui-custom/AnimatedText";
import { Play, RefreshCw, Settings, TrendingUp, AlertCircle, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import TwitchSettings from "@/components/TwitchSettings";
import { detectViralMoments, clearAuthToken } from "@/utils/twitchApi";

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
  const [hasCredentials, setHasCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingRealData, setFetchingRealData] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [forceUseMockData, setForceUseMockData] = useState(false);

  const checkCredentials = () => {
    const clientSecret = localStorage.getItem('twitch_client_secret');
    const hasSecret = !!clientSecret;
    setHasCredentials(hasSecret);
    return hasSecret;
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
      
      // Clear previous auth token to ensure we're using the latest credentials
      clearAuthToken();
      
      let moments: ClipData[] = [];
      
      if (forceUseMockData) {
        // If user has explicitly selected to use mock data
        moments = await detectViralMoments(true);
        setUsingMockData(true);
      } else {
        try {
          // Try to get real data first
          moments = await detectViralMoments(false);
          setUsingMockData(false);
          
          // Check if we're using mock data by looking at the ID format
          // Mock IDs typically start with "mock-viral-" or "demo-"
          const isMockData = moments.length > 0 && 
            (moments[0].id.startsWith('mock') || moments[0].id.startsWith('demo'));
          
          setUsingMockData(isMockData);
        } catch (err) {
          console.error("Failed to get real data:", err);
          
          // Only fall back to mock data if user hasn't provided credentials
          if (!hasCredentials) {
            toast.info("Using demo clips - Twitch API authentication failed");
            moments = await detectViralMoments(true);
            setUsingMockData(true);
          } else {
            // If user has provided credentials, show the error
            throw err;
          }
        }
      }
      
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
        
        if (usingMockData) {
          toast.info("Using demo clips - To get real clips, provide your Twitch API credentials in Settings");
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
      
      if (!viralClips.length) {
        // Only fall back to mock data if we don't have any clips
        toast.info("Showing demo data due to error");
        const mockData = await detectViralMoments(true);
        setViralClips(mockData);
        setUsingMockData(true);
      }
    } finally {
      setIsLoading(false);
      setFetchingRealData(false);
    }
  };

  const startMonitoring = () => {
    setIsLoading(true);
    
    fetchViralMoments().then(() => {
      const intervalId = window.setInterval(fetchViralMoments, 2 * 60 * 1000);
      setMonitoringInterval(intervalId as unknown as number);
      setIsMonitoring(true);
      setIsLoading(false);
      toast.success("Monitoring started. Checking for viral clips every 2 minutes.");
    }).catch(() => {
      setIsLoading(false);
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
    // Force clear any cached auth token to ensure fresh data
    clearAuthToken();
    fetchViralMoments();
  };

  const handleSettingsSaved = () => {
    const hasSecret = checkCredentials();
    if (hasSecret) {
      // Force clear auth token to make sure we use new credentials
      clearAuthToken();
      setForceUseMockData(false);
      toast.success("Twitch credentials saved! Using real Twitch data.");
      // Fetch new data immediately with new credentials
      fetchViralMoments();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Toggle between real and mock data
  const toggleMockData = () => {
    setForceUseMockData(!forceUseMockData);
    toast.info(forceUseMockData 
      ? "Switching to real Twitch data if available" 
      : "Switching to demo data mode");
    
    // Refresh the data to apply the change
    setTimeout(() => {
      fetchViralMoments();
    }, 500);
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
                
                <div className="grid gap-4 mt-4">
                  {!hasCredentials && (
                    <div className="p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            <strong>No API credentials:</strong> To get real-time Twitch clips, you need to add your Twitch API credentials.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setIsSettingsOpen(true)}
                          >
                            Add Twitch Credentials
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {usingMockData && hasCredentials && (
                    <div className="p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            <strong>Still seeing old clips?</strong> Try refreshing the data or check your API credentials in Settings.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={refreshData}
                            >
                              Refresh Data
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsSettingsOpen(true)}
                            >
                              Check Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {usingMockData && !hasCredentials && (
                    <div className="p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            <strong>Demo Mode:</strong> Currently showing demo clips because the Twitch API returned authentication errors.
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            To get real-time clips, add your Twitch API credentials in Settings.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={toggleMockData}
                            >
                              {forceUseMockData ? "Try Real Data" : "Use Demo Data"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsSettingsOpen(true)}
                            >
                              Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
