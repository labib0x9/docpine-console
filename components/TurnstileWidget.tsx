"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { TURNSTILE_SITE_KEY, IS_TURNSTILE_ENABLED } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string) => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: string) => void;
  name?: string; // e.g. "cf-turnstile-response" for native form
  className?: string;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    { onVerify, onExpire, onError, name, className = "" },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [token, setToken] = useState<string>("");

    useImperativeHandle(ref, () => ({
      reset: () => {
        setToken("");
        if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!IS_TURNSTILE_ENABLED || !containerRef.current) return;

      let isMounted = true;

      const initWidget = () => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "dark",
            callback: (resToken: string) => {
              if (!isMounted) return;
              setToken(resToken);
              onVerify?.(resToken);
            },
            "expired-callback": () => {
              if (!isMounted) return;
              setToken("");
              onExpire?.();
            },
            "error-callback": (errCode) => {
              if (!isMounted) return;
              setToken("");
              onError?.(errCode);
            },
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.warn("Turnstile render warning:", e);
        }
      };

      if (window.turnstile) {
        initWidget();
      } else {
        const existingScript = document.getElementById("cf-turnstile-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "cf-turnstile-script";
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => {
            initWidget();
          };
          document.head.appendChild(script);
        } else {
          existingScript.addEventListener("load", initWidget);
        }
      }

      return () => {
        isMounted = false;
        if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore error on unmount
          }
          widgetIdRef.current = null;
        }
      };
    }, [onVerify, onExpire, onError]);

    if (!IS_TURNSTILE_ENABLED) {
      return null;
    }

    return (
      <div className={`flex flex-col items-center justify-center my-2 ${className}`}>
        <div ref={containerRef} className="min-h-[65px]" />
        {name && <input type="hidden" name={name} value={token} />}
      </div>
    );
  }
);
