import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PublicHotspotMap } from "@/components/map/public-hotspot-map";

export const metadata: Metadata = {
  title: "Hotspot Map",
  description:
    "Explore public drainage hazards and recurring hotspot locations across Kampala.",
};

export default function MapPage() {
  return (
    <SiteShell>
      <PublicHotspotMap />
    </SiteShell>
  );
}
