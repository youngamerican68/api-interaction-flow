import { useState } from "react";
import { Container } from "@/components/ui-custom/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { AnimatedText } from "@/components/ui-custom/AnimatedText";
import { Play, RefreshCw, Settings, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  const [viralClips, setViralClips] = useState<ClipData[]>([
    // Sample data for demonstration
    {
      id: "clip1",
      streamerName: "ExampleStreamer",
      viewerCount: 15420,
      chatActivity: 127,
      clipUrl: "https://clips.twitch.tv/example",
      thumbnailUrl: "https://via.placeholder.com/320x180.png?text=Example+Viral+Moment",
      timestamp: new Date().toISOString(),
    },
    {
      id: "clip2",
      streamerName: "AnotherStreamer",
      viewerCount: 8750,
      chatActivity: 94,
      clipUrl: "https://clips.twitch.tv/example2",
      thumbnailUrl: "https://via.placeholder.com/320x180.png?text=Another+Viral+Moment",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ]);

  const startMonitoring = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsMonitoring(true);
      setIsLoading(false);
    }, 1500);
  };

  const stopMonitoring = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsMonitoring(false);
      setIsLoading(false);
    }, 1000);
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      // In a real app, this would fetch new data from the Twitch API
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-12 bg-gradient-to-b from-secondary/50 to-background">
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
                    >
                      Settings
                    </Button>
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
                          ? new Date(viralClips[0].timestamp).toLocaleTimeString() 
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
                {viralClips.length > 0 ? (
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
                              <span>{new Date(clip.timestamp).toLocaleString()}</span>
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
                      Start monitoring to detect viral moments on Twitch.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ViralDetector;
