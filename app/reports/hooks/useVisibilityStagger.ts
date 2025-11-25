'use client';

import { useEffect } from 'react';

export interface UseVisibilityStaggerOptions {
  itemSelector: string;
  threshold?: number;
  interval?: number;
}

export function useVisibilityStagger(
  containerRef: React.RefObject<HTMLElement>,
  options: UseVisibilityStaggerOptions
) {
  const { itemSelector, threshold = 0.1, interval = 60 } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];

    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemIndex = items.indexOf(entry.target as HTMLElement);
            (entry.target as HTMLElement).style.setProperty(
              '--stagger-delay',
              `${itemIndex * interval}ms`
            );
            (entry.target as HTMLElement).setAttribute('data-visible', 'true');
          }
        });
      },
      { threshold }
    );

    items.forEach((item) => {
      item.setAttribute('data-visible', 'false');
      observer.observe(item);
    });

    return () => {
      items.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, [containerRef, itemSelector, threshold, interval]);
}
