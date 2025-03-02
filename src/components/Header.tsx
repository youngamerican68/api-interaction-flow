
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuIcon, X } from "lucide-react";
import { Container } from "./ui-custom/Container";
import { Button } from "./ui-custom/Button";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  // Hide header on viral-detector page
  if (location.pathname === "/viral-detector") {
    return null;
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Documentation", href: "/docs" },
    { name: "GitHub", href: "https://github.com/wild-card-ai/agents-json" },
    { name: "Python", href: "/python" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled
          ? "py-3 bg-background/80 backdrop-blur-lg shadow-sm"
          : "py-5 bg-transparent"
      )}
    >
      <Container>
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                W
              </div>
              <span className="text-lg font-semibold">Wildcard</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-4 py-2 rounded-lg text-foreground/80 hover:text-foreground hover:bg-secondary transition-all duration-200"
              >
                {item.name}
              </Link>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <Button size="sm" className="ml-2">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "fixed inset-x-0 top-[calc(4rem)] h-screen bg-background/95 backdrop-blur-md md:hidden overflow-hidden transition-all duration-300 ease-spring transform origin-top",
            isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-10 pointer-events-none"
          )}
        >
          <div className="p-4 space-y-2 border-t">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4">
              <Button className="w-full">Get Started</Button>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
