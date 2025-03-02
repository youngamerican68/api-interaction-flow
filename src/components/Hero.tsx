
import { ArrowRight, Code, Zap } from "lucide-react";
import { Container } from "./ui-custom/Container";
import { Button } from "./ui-custom/Button";
import { GlassPanel } from "./ui-custom/GlassPanel";
import { AnimatedText } from "./ui-custom/AnimatedText";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-40"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      
      <Container centered className="relative z-10">
        <div className="inline-flex items-center px-3 py-1.5 mb-6 border border-border bg-background/50 rounded-full">
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full mr-2">
            NEW
          </span>
          <span className="text-sm font-medium">Introducing agents.json</span>
        </div>

        <AnimatedText
          text="The Bridge Between AI and APIs"
          tag="h1"
          className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-4xl text-center mb-6"
          animation="fade"
          delay={0.1}
        />

        <AnimatedText
          text="A specification for AI agents to seamlessly interact with APIs, building on top of the OpenAPI standard."
          tag="p"
          className="text-lg md:text-xl text-muted-foreground max-w-2xl text-center mb-10"
          animation="fade"
          delay={0.2}
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" className="group">
            Get Started
            <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline">
            View on GitHub
            <Code size={16} className="ml-2" />
          </Button>
        </div>

        <div className="relative animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <GlassPanel className="p-6 md:p-8 w-full max-w-4xl mx-auto">
            <div className="code-block text-left">
              <pre>
                <span className="keyword">const</span> query = <span className="string">"Create a product in Stripe called Premium Access for $100"</span>;{"\n"}
                <span className="keyword">const</span> <span className="variable">actions</span> = <span className="keyword">await</span> <span className="function">wildcard.discover</span>(query);{"\n"}
                {"\n"}
                <span className="comment">// Format discovered actions for LLM usage</span>{"\n"}
                <span className="keyword">const</span> <span className="variable">tools</span> = <span className="function">getTools</span>(actions, <span className="variable">ToolFormat.OPENAI</span>);{"\n"}
                {"\n"}
                <span className="comment">// Use with your AI agent</span>{"\n"}
                <span className="keyword">const</span> <span className="variable">completion</span> = <span className="keyword">await</span> openai.chat.completions.<span className="function">create</span>{'({'}{"\n"}
                {"  "}model: <span className="string">"gpt-4o"</span>,{"\n"}
                {"  "}messages: [{"\n"}
                {"    "}{'{'} role: <span className="string">"user"</span>, content: query {'},'}{"\n"}
                {"  "}],{"\n"}
                {"  "}tools: <span className="variable">tools</span>{"\n"}
                {'}'});{"\n"}
                {"\n"}
                <span className="comment">// Execute the AI's chosen action</span>{"\n"}
                <span className="keyword">const</span> <span className="variable">result</span> = <span className="keyword">await</span> <span className="function">execute</span>(actions, completion);
              </pre>
            </div>
          </GlassPanel>
          
          {/* Floating badge */}
          <div className="absolute -top-3 -right-3 md:top-4 md:-right-8">
            <div className="bg-accent text-accent-foreground px-4 py-2 rounded-full flex items-center shadow-lg animate-float">
              <Zap size={16} className="mr-1" />
              <span className="font-medium text-sm">Seamless Integration</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
