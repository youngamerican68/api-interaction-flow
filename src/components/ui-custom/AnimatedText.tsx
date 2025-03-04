
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type AnimationStyle = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
type HTMLTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

interface AnimatedTextProps {
  text: string;
  tag?: HTMLTag;
  className?: string;
  animation?: AnimationStyle;
  delay?: number;
  duration?: number;
}

const animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  tag = 'p',
  className = '',
  animation = 'fade',
  delay = 0,
  duration = 0.5,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Using a simplified component rendering during SSR/before mount
    const Component = tag;
    return <Component className={className}>{text}</Component>;
  }

  const selectedAnimation = animations[animation];
  const transition = { duration, delay, ease: 'easeOut' };

  // Define the component dynamically
  const Component = motion[tag] || motion.div;

  return (
    <Component
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      transition={transition}
      className={cn(className)}
    >
      {text}
    </Component>
  );
};
