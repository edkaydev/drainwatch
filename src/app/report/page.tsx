import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { ReportForm } from "@/components/report/report-form";

export const metadata: Metadata = {
  title: "Report an Incident",
  description:
    "Report a blocked drain, open manhole, flooding, or other drainage hazard in Kampala.",
};

export default function ReportPage() {
  return (
    <SiteShell>
      <Suspense>
        <ReportForm />
      </Suspense>
    </SiteShell>
  );
}
