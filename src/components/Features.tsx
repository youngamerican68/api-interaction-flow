
import { ArrowRight, Bot, Cpu, Globe, Layers, Link, Repeat, Zap } from "lucide-react";
import { Container } from "./ui-custom/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui-custom/Card";
import { AnimatedText } from "./ui-custom/AnimatedText";
import { Button } from "./ui-custom/Button";

const features = [
  {
    title: "Built on OpenAPI",
    description: "Leverages existing standards and infrastructure, requiring minimal changes to existing APIs.",
    icon: <Globe className="h-6 w-6 text-primary" />,
    delay: 0.1,
  },
  {
    title: "Optimized for LLMs",
    description: "Designed specifically for AI consumption, making it easier for language models to understand and use APIs.",
    icon: <Bot className="h-6 w-6 text-primary" />,
    delay: 0.2,
  },
  {
    title: "Stateless Architecture",
    description: "Orchestration is handled by the calling agent, enabling flexible implementation across different environments.",
    icon: <Cpu className="h-6 w-6 text-primary" />,
    delay: 0.3,
  },
  {
    title: "Multi-Step Flows",
    description: "Define complex workflows with a series of API calls, enabling sophisticated agent behaviors.",
    icon: <Layers className="h-6 w-6 text-primary" />,
    delay: 0.4,
  },
  {
    title: "Data Linking",
    description: "Connect outputs from one API call to inputs of another, creating seamless chains of operations.",
    icon: <Link className="h-6 w-6 text-primary" />,
    delay: 0.5,
  },
  {
    title: "Easy Integration",
    description: "Drop-in solution that works with existing agent architectures and infrastructure.",
    icon: <Repeat className="h-6 w-6 text-primary" />,
    delay: 0.6,
  },
];

const Features = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <Container>
        <div className="text-center mb-16">
          <AnimatedText
            text="Why agents.json?"
            tag="h2"
            className="text-3xl md:text-4xl font-bold mb-4"
            animation="fade"
          />
          <AnimatedText
            text="The specification that makes AI-API interactions reliable and predictable."
            tag="p"
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            animation="fade"
            delay={0.1}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="glass" 
              hoverEffect 
              className="opacity-0 animate-scale-in"
              style={{ animationDelay: `${feature.delay}s`, animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-primary/90 to-accent/90 p-8 md:p-10 text-white shadow-lg opacity-0 animate-fade-in" style={{ animationDelay: "0.7s", animationFillMode: 'forwards' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center">
                <Zap className="mr-2" /> Ready to enhance your AI agents?
              </h3>
              <p className="text-white/80 max-w-xl">
                Start implementing the agents.json specification today and watch your AI agents perform complex API workflows with ease.
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shrink-0"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Get Started
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Features;
