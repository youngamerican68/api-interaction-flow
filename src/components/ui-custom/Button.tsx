
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "outline" | "minimal";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    children, 
    variant = "primary", 
    size = "md", 
    isLoading = false,
    icon,
    iconPosition = "left",
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:opacity-90 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-secondary/20 focus:ring-offset-2 transition-all",
      ghost: "bg-transparent hover:bg-secondary focus:ring-2 focus:ring-secondary/20 transition-all",
      accent: "bg-accent text-accent-foreground hover:opacity-90 focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 transition-all",
      outline: "bg-transparent border border-input hover:bg-secondary/50 focus:ring-2 focus:ring-primary/20 transition-all",
      minimal: "bg-transparent hover:bg-secondary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
    };

    const sizes = {
      sm: "h-9 rounded-lg px-3 text-sm",
      md: "h-10 rounded-lg px-4",
      lg: "h-12 rounded-lg px-6 text-lg",
      icon: "h-10 w-10 rounded-lg flex items-center justify-center p-0"
    };

    return (
      <button
        className={cn(
          "relative font-medium shadow-button inline-flex items-center justify-center whitespace-nowrap no-tap-highlight",
          "transition-spring duration-300 ease-out will-change-transform",
          "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        <span className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
