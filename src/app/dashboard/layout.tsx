import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "Operations Dashboard",
    template: "%s — DrainWatch Operations",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
