
import { Container } from "./ui-custom/Container";
import { Github, Twitter, Zap } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                W
              </div>
              <span className="text-xl font-semibold">Wildcard</span>
            </div>
            <p className="text-muted-foreground max-w-md mb-6">
              Making AI-API interactions reliable and predictable with agents.json,
              an open standard built on OpenAPI.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/wild-card-ai/agents-json"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com/wildcardai"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/python"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Python Quickstart
                </a>
              </li>
              <li>
                <a
                  href="/schema"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Schema Reference
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/wild-card-ai/agents-json"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://discord.gg/wildcard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/wildcardai"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="/contributing"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Wildcard AI. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <Zap size={14} className="text-primary mr-1" />
            <span className="text-sm">
              Powered by agents.json
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
