
import { useState, useEffect } from "react";
import { Container } from "@/components/ui-custom/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { AnimatedText } from "@/components/ui-custom/AnimatedText";
import { Play, RefreshCw, Settings, TrendingUp, AlertCircle } from "lucide-react";
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
  const [hasCredentials, setHasCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Twitch credentials are set
  useEffect(() => {
    const clientId = localStorage.getItem('twitch_client_id');
    const clientSecret = localStorage.getItem('twitch_client_secret');
    setHasCredentials(!!clientId && !!clientSecret);
    
    // If no credentials are set, show a one-time info toast
    if (!clientId || !clientSecret) {
      toast.info(
        "Please set your Twitch API credentials in Settings to start monitoring",
        { id: "credentials-missing", duration: 5000 }
      );
    }
  }, [isSettingsOpen]);

  // Clean up interval on unmount
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
      const moments = await detectViralMoments();
      
      if (moments.length > 0) {
        // Only notify for new clips when monitoring
        if (isMonitoring && viralClips.length > 0) {
          const newClips = moments.filter(
            newClip => !viralClips.some(existingClip => existingClip.id === newClip.id)
          );
          
          if (newClips.length > 0) {
            toast.success(`Detected ${newClips.length} new viral clips!`);
          }
        }
        
        setViralClips(moments);
      }
    } catch (err) {
      console.error("Error fetching viral moments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch viral moments");
      toast.error("Error detecting viral moments");
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = () => {
    if (!hasCredentials) {
      setIsSettingsOpen(true);
      return;
    }
    
    setIsLoading(true);
    
    // Initial fetch
    fetchViralMoments().then(() => {
      // Set up polling interval (every 2 minutes)
      const intervalId = window.setInterval(fetchViralMoments, 2 * 60 * 1000);
      setMonitoringInterval(intervalId as unknown as number);
      setIsMonitoring(true);
      setIsLoading(false);
      toast.success("Monitoring started. Checking for viral clips every 2 minutes.");
    });
  };

  const stopMonitoring = () => {
    setIsLoading(true);
    
    // Clear interval
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
                
                {!hasCredentials && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Twitch API credentials not set. Click Settings to configure.</span>
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
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
                </div>
              </CardContent>
            </Card>
          </div>

          <Card variant="default">
            <CardHeader>
              <CardTitle>Detected Viral Moments</CardTitle>
              <CardDescription>
                Clips automatically generated from detected viral moments on Twitch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && viralClips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Fetching viral moments...</p>
                </div>
              ) : viralClips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viralClips.map((clip) => (
                    <Card key={clip.id} variant="outlined" hoverEffect>
                      <CardContent className="p-0">
                        <div className="relative aspect-video">
                          <img 
                            src={clip.thumbnailUrl} 
                            alt={`${clip.streamerName} clip`}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                          <Button 
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full"
                            variant="secondary"
                            icon={<Play size={20} />}
                            onClick={() => window.open(clip.clipUrl, '_blank')}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold truncate">{clip.streamerName}</h3>
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>{formatTimestamp(clip.timestamp)}</span>
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
                    {hasCredentials 
                      ? "Start monitoring to detect viral moments on Twitch."
                      : "Set your Twitch API credentials in settings to get started."}
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
      />
    </div>
  );
};

export default ViralDetector;
