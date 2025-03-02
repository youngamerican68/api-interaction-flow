
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DemoSection from "@/components/DemoSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui-custom/Button";
import { Container } from "@/components/ui-custom/Container";
import { TrendingUp } from "lucide-react";

const Index = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <DemoSection />
        
        {/* New section for the Viral Detector */}
        <section className="py-16 bg-primary/5">
          <Container centered>
            <h2 className="text-3xl font-bold mb-6 text-center">Showcase Application</h2>
            <p className="text-xl text-muted-foreground max-w-2xl text-center mb-8">
              Check out our Twitch Viral Moment Detector - built with Wildcard Bridge
            </p>
            <Link to="/viral-detector">
              <Button size="lg" icon={<TrendingUp size={20} />}>
                Try Viral Detector
              </Button>
            </Link>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
