import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const aiConfigured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  return <SettingsView aiConfigured={aiConfigured} />;
}
