"use client";

import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";

// Lets React Aria links (Untitled UI buttons/nav items with an href) use the
// Next.js client-side router instead of full page loads.
export function RouteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <RouterProvider navigate={router.push}>{children}</RouterProvider>;
}
