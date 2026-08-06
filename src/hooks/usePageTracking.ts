import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { trackPageView } from "@/lib/analytics";

/**
 * Tracks page views on every route change.
 * Mount this once in the root component — it subscribes to the router
 * and fires trackPageView whenever the pathname changes.
 */
export const usePageTracking = (): void => {
  const router = useRouter();

  useEffect(() => {
    // Fire for the initial load
    trackPageView(window.location.pathname, document.title);

    // Subscribe to future navigations
    const unsubscribe = router.subscribe("onLoad", ({ toLocation }) => {
      trackPageView(toLocation.pathname, document.title);
    });

    return unsubscribe;
  }, [router]);
};
