
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
                if (animation === "fade") {
                  elementRef.current.classList.add("animate-fade-in");
                } else if (animation === "slide") {
                  elementRef.current.classList.add("animate-slide-up");
                } else if (animation === "typewriter") {
                  // Implement typewriter animation logic if needed
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

  const getAnimationClasses = () => {
    if (animation === "fade") {
      return "opacity-0";
    } else if (animation === "slide") {
      return "opacity-0 translate-y-4";
    } else if (animation === "typewriter") {
      return ""; // Add typewriter specific classes if needed
    } else {
      return "";
    }
  };

  return (
    <Tag
      ref={elementRef as React.RefObject<any>}
      style={{ animationDuration: `${duration}s` }}
      className={cn(
        "will-change-transform text-balance",
        animation !== "none" && getAnimationClasses(),
        className
      )}
    >
      {text}
    </Tag>
  );
};

export { AnimatedText };
