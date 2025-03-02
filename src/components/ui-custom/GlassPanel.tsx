
import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "heavy";
  dark?: boolean;
  border?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, intensity = "medium", dark = false, border = true, ...props }, ref) => {
    const blurIntensity = {
      light: "backdrop-blur-sm",
      medium: "backdrop-blur-md",
      heavy: "backdrop-blur-xl",
    };

    const bgIntensity = dark
      ? {
          light: "bg-surface-dark/30",
          medium: "bg-surface-dark/50",
          heavy: "bg-surface-dark/70",
        }
      : {
          light: "bg-surface/30",
          medium: "bg-surface/50",
          heavy: "bg-surface/70",
        };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-300",
          blurIntensity[intensity],
          bgIntensity[intensity],
          border && "border border-white/10",
          dark ? "shadow-glass-dark" : "shadow-glass",
          className
        )}
        {...props}
      />
    );
  }
);

GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
