
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  animation?: "fade" | "slide" | "typewriter" | "none";
  delay?: number;
  duration?: number;
  tag?: keyof JSX.IntrinsicElements;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  animation = "fade",
  delay = 0,
  duration = 0.6,
  tag: Tag = "div"
}) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current || animation === "none") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (elementRef.current) {
                switch (animation) {
                  case "fade":
                    elementRef.current.classList.add("animate-fade-in");
                    break;
                  case "slide":
                    elementRef.current.classList.add("animate-slide-up");
                    break;
                  case "typewriter":
                    // Implement typewriter animation logic if needed
                    break;
                  default:
                    break;
                }
              }
            }, delay * 1000);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [animation, delay]);

  const animationClasses = () => {
    switch (animation) {
      case "fade":
        return "opacity-0";
      case "slide":
        return "opacity-0 translate-y-4";
      case "typewriter":
        return ""; // Add typewriter specific classes if needed
      default:
        return "";
    }
  };

  return (
    <Tag
      ref={elementRef as React.RefObject<any>}
      style={{ animationDuration: `${duration}s` }}
      className={cn(
        "will-change-transform text-balance",
        animation !== "none" && animationClasses(),
        className
      )}
    >
      {text}
    </Tag>
  );
};

export { AnimatedText };
