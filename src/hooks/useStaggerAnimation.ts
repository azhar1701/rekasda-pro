import { useEffect, useRef } from 'react';

/**
 * Hook for staggered list animations
 * Applies animation delay to each child element
 */
export const useStaggerAnimation = (delay: number = 50) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.children;
    Array.from(children).forEach((child, index) => {
      if (child instanceof HTMLElement) {
        child.style.animationDelay = `${index * delay}ms`;
        child.classList.add('stagger-item');
      }
    });
  }, [delay]);

  return containerRef;
};
