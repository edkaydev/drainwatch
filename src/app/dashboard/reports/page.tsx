import type { Metadata } from "next";
import { ReportsView } from "@/components/dashboard/reports-view";

export const metadata: Metadata = { title: "Reports & exports" };

export default function ReportsPage() {
  return <ReportsView />;
}
