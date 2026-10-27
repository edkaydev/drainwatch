import type { Metadata } from "next";
import { SupportRequestsView } from "@/components/dashboard/support-requests-view";

export const metadata: Metadata = { title: "Support requests" };

export default function SupportPage() {
  return <SupportRequestsView />;
}
