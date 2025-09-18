// app/Localhost5517Patch.jsx
"use client";

import { useEffect } from "react";

/**
 * Kodunda "http://localhost:5517" yazan çağrıları *dokunmadan* bırak.
 * Bu patch prod'da (ve istersen dev'de flag ile) onları /proxy/... yapar.
 */
const USE_IN_DEV = process.env.NEXT_PUBLIC_USE_RENDER_IN_DEV === "true";

export default function Localhost5517Patch() {
  useEffect(() => {
    const inProd = process.env.NODE_ENV === "production";
    if (!inProd && !USE_IN_DEV) return;

    // fetch patch
    const origFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      try {
        const url = typeof input === "string" ? input : input?.url ?? "";
        if (url.startsWith("http://localhost:5517")) {
          const path = url.replace("http://localhost:5517", "");
          return origFetch(`/proxy${path}`, init);
        }
      } catch {}
      return origFetch(input, init);
    };

    // axios patch (varsa)
    if (typeof window.axios !== "undefined") {
      try {
        const ax = window.axios;
        ax.interceptors.request.use((cfg) => {
          if (
            typeof cfg.url === "string" &&
            cfg.url.startsWith("http://localhost:5517")
          ) {
            cfg.url = cfg.url.replace("http://localhost:5517", "/proxy");
          }
          if (
            typeof ax.defaults.baseURL === "string" &&
            ax.defaults.baseURL.startsWith("http://localhost:5517")
          ) {
            ax.defaults.baseURL = "/proxy";
          }
          return cfg;
        });
      } catch {}
    }
  }, []);

  return null;
}
