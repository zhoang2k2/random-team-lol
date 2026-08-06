import { createFileRoute, Outlet } from "@tanstack/react-router";

import { V2StoreProvider } from "@/contexts/V2StoreContext";

export const Route = createFileRoute("/v2")({
  component: V2Layout,
});

// Layout route: wraps all /v2/* pages with V2StoreProvider.
// Renders <Outlet /> so child routes (index, random) display their own content.
const V2Layout = () => (
  <V2StoreProvider>
    <Outlet />
  </V2StoreProvider>
);
