import { Spinner } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <Spinner className="h-6 w-6 text-brand-600" />
      <p className="text-sm text-ink-500">Loading DrainWatch AI…</p>
    </div>
  );
}
