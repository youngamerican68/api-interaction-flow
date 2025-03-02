
import { useState } from "react";
import { Container } from "./ui-custom/Container";
import { GlassPanel } from "./ui-custom/GlassPanel";
import { AnimatedText } from "./ui-custom/AnimatedText";
import { Button } from "./ui-custom/Button";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const DemoSection = () => {
  const [userQuery, setUserQuery] = useState("");
  const [demoState, setDemoState] = useState<"idle" | "searching" | "executing" | "complete">("idle");
  const [demoStep, setDemoStep] = useState(0);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery) return;
    
    runDemo();
  };

  const runDemo = async () => {
    setDemoState("searching");
    
    // Simulate API discovery
    setTimeout(() => {
      setDemoState("executing");
      setDemoStep(1);
      
      // Simulate execution steps
      const interval = setInterval(() => {
        setDemoStep(prev => {
          if (prev >= 3) {
            clearInterval(interval);
            setDemoState("complete");
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }, 2000);
  };

  const resetDemo = () => {
    setDemoState("idle");
    setDemoStep(0);
  };

  return (
    <section className="py-20 relative overflow-hidden bg-secondary/50">
      <Container centered>
        <AnimatedText
          text="See it in action"
          tag="h2"
          className="text-3xl md:text-4xl font-bold mb-4"
          animation="fade"
        />
        <AnimatedText
          text="Try a simulated demo of how Wildcard Bridge works"
          tag="p"
          className="text-xl text-muted-foreground max-w-2xl mb-12"
          animation="fade"
          delay={0.1}
        />

        <GlassPanel className="max-w-3xl w-full p-6 md:p-8 opacity-0 animate-scale-in" style={{ animationDelay: "0.2s", animationFillMode: 'forwards' }}>
          <form onSubmit={handleDemoSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Enter a task like 'Create a product in Stripe for $99'"
                disabled={demoState !== "idle"}
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button 
                type="submit" 
                disabled={!userQuery || demoState !== "idle"}
                isLoading={demoState === "searching"}
              >
                {demoState === "searching" ? "Discovering..." : "Run Demo"}
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="font-medium text-lg mb-4">Demo Progress</h3>
            
            <div className="space-y-3">
              <DemoStep
                number={1}
                title="Discover relevant API actions"
                description="Wildcard searches for matching API actions based on your query"
                status={
                  demoState === "searching" 
                    ? "loading" 
                    : demoState !== "idle" 
                      ? "complete" 
                      : "pending"
                }
              />
              
              <DemoStep
                number={2}
                title="Generate API request parameters"
                description="AI determines the correct parameters to use for the API call"
                status={
                  demoStep === 1 && demoState === "executing"
                    ? "loading"
                    : demoStep > 1
                      ? "complete"
                      : "pending"
                }
              />
              
              <DemoStep
                number={3}
                title="Execute the API request"
                description="Wildcard Bridge sends the request to the API with proper authentication"
                status={
                  demoStep === 2 && demoState === "executing"
                    ? "loading"
                    : demoStep > 2
                      ? "complete"
                      : "pending"
                }
              />
              
              <DemoStep
                number={4}
                title="Process and return results"
                description="Process the API response and return results to the AI"
                status={
                  demoStep === 3 && demoState === "executing"
                    ? "loading"
                    : demoState === "complete"
                      ? "complete"
                      : "pending"
                }
              />
            </div>

            {demoState === "complete" && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h4 className="text-xl font-medium mb-2">Demo Completed Successfully!</h4>
                  <p className="text-muted-foreground mb-4">
                    In a real implementation, the API action would have been executed against the actual API.
                  </p>
                  <Button 
                    onClick={resetDemo}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Try Another Query
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      </Container>
    </section>
  );
};

interface DemoStepProps {
  number: number;
  title: string;
  description: string;
  status: "pending" | "loading" | "complete";
}

const DemoStep = ({ number, title, description, status }: DemoStepProps) => {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border">
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : status === "complete" ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{number}</span>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default DemoSection;
