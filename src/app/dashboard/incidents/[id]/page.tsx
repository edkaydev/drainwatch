import type { Metadata } from "next";
import { IncidentDetailView } from "@/components/dashboard/incident-detail-view";

export const metadata: Metadata = { title: "Incident detail" };

export default function IncidentDetailPage() {
  return <IncidentDetailView />;
}
