"use client";

import { useCallback, useEffect, useRef } from "react";

import { isTurnstileEnabled, turnstileSiteKey } from "@/lib/turnstile";

type TurnstileOptions = {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

type TurnstileInstance = {
  render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
  reset: (widgetId?: string) => void;
  remove?: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

export interface TurnstileProps {
  action?: string;
  cData?: string;
  className?: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile widget loader.
 * Renders explicitly to avoid SSR issues; parent can force rerender via `key`.
 */
export function Turnstile({ action = "auth", cData, className, onSuccess, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !turnstileSiteKey) {
      return;
    }

    // Clear previous widget if any
    if (widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      window.turnstile.remove?.(widgetIdRef.current);
      widgetIdRef.current = undefined;
    }

    const id = window.turnstile.render(containerRef.current, {
      sitekey: turnstileSiteKey,
      action,
      cData,
      callback: onSuccess,
      "error-callback": onError,
      "expired-callback": onExpire,
    });

    widgetIdRef.current = id;
  }, [action, cData, onError, onExpire, onSuccess]);

  useEffect(() => {
    if (!isTurnstileEnabled()) return;

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-turnstile-script]");
    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener("load", renderWidget, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = renderWidget;
    script.onerror = () => onError?.();
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [onError, renderWidget]);

  useEffect(
    () => () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove?.(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    },
    []
  );

  if (!isTurnstileEnabled()) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}
