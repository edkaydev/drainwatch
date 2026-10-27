import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { PublicHotspotMap } from "@/components/map/public-hotspot-map";

export const metadata: Metadata = {
  title: "Hotspot Map",
  description: "Staff view of reported drainage hazards and recurring hotspot locations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MapPage() {
  return (
    <SiteShell>
      <RequireAuth>
        <PublicHotspotMap />
      </RequireAuth>
    </SiteShell>
  );
}
