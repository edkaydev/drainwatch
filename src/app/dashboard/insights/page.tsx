import type { Metadata } from "next";
import { AiInsightsView } from "@/components/dashboard/ai-insights-view";

export const instant = false;
export const metadata: Metadata = { title: "AI Insights" };

export default function InsightsPage() {
  return <AiInsightsView />;
}
