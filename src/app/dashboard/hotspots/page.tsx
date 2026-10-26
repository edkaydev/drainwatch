import type { Metadata } from "next";
import { HotspotsView } from "@/components/dashboard/hotspots-view";

export const metadata: Metadata = { title: "Hotspots" };

export default function HotspotsPage() {
  return <HotspotsView />;
}
