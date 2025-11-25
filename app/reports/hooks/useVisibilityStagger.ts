'use client';

import { useEffect, RefObject } from 'react';

interface UseVisibilityStaggerOptions {
  /** CSS selector for items to observe */
  itemSelector: string;
  /** Optional threshold (0-1), default 0.1 */
  threshold?: number;
  /** Optional root margin, default '0px' */
  rootMargin?: string;
  /** Whether to respect prefers-reduced-motion */
  respectReducedMotion?: boolean;
}

/**
 * Hook: 为容器内的卡片元素创建 IntersectionObserver，
 * 当卡片进入视窗时添加 data-visible="true" 属性，触发 stagger 淡入动画。
 *
 * 用法：
 * const gridRef = useRef<HTMLDivElement>(null);
 * useVisibilityStagger(gridRef, { itemSelector: '[data-stagger-item]' });
 */
export function useVisibilityStagger(
  containerRef: RefObject<HTMLElement>,
  options: UseVisibilityStaggerOptions = { itemSelector: '[data-stagger-item]' }
) {
  const {
    itemSelector,
    threshold = 0.1,
    rootMargin = '0px',
    respectReducedMotion = true,
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    // 检测用户偏好：是否启用 reduce-motion
    const prefersReducedMotion =
      respectReducedMotion &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 卡片进入视窗
            entry.target.setAttribute('data-visible', 'true');
            // 观察到后立即 unobserve
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // 获取所有需要观察的卡片
    const items = containerRef.current.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
      // 初始状态
      item.setAttribute('data-visible', 'false');

      // 若启用 reduce-motion，直接显示，跳过动画 delay
      if (prefersReducedMotion) {
        item.setAttribute('data-visible', 'true');
      } else {
        // 添加 stagger delay 属性（用于 CSS 动画）
        const delay = index * 60; // 60ms 间隔
        (item as HTMLElement).style.setProperty('--stagger-delay', `${delay}ms`);
        observer.observe(item);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [containerRef, itemSelector, threshold, rootMargin, respectReducedMotion]);
}
