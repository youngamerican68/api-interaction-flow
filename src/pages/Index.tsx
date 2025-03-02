
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DemoSection from "@/components/DemoSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";

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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
