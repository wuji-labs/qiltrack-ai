'use client';

import { useEffect } from 'react';

export interface UseVisibilityStaggerOptions {
  itemSelector: string;
  threshold?: number;
  interval?: number;
  respectReducedMotion?: boolean;
}

export function useVisibilityStagger(
  containerRef: React.RefObject<HTMLElement>,
  options: UseVisibilityStaggerOptions
) {
  const { itemSelector, threshold = 0.1, interval = 60, respectReducedMotion = true } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];

    if (items.length === 0) return;

    // 检测 prefers-reduced-motion
    const prefersReducedMotion = respectReducedMotion &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // 初始化所有项：设置 delay 并根据 reduce-motion 决定是否立即显示或观察
    items.forEach((item, index) => {
      item.style.setProperty('--stagger-delay', `${index * interval}ms`);
      item.setAttribute('data-visible', 'false');

      if (prefersReducedMotion) {
        // 无障碍模式：立即显示所有项，跳过动画
        item.setAttribute('data-visible', 'true');
      } else {
        // 正常模式：观察可见性
        observer.observe(item);
      }
    });

    return () => {
      items.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, [containerRef, itemSelector, threshold, interval, respectReducedMotion]);
}
