import type { Metadata } from "next";
import { IncidentsView } from "@/components/dashboard/incidents-view";

export const metadata: Metadata = { title: "Incidents" };

export default function IncidentsPage() {
  return <IncidentsView />;
}
