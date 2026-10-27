"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Spinner } from "@/components/ui/feedback";
import { useLanguage } from "@/components/layout/language-provider";
import { createSupportRequest, SUPPORT_MESSAGE_MAX } from "@/lib/support-requests";
import { isFirebaseConfigured } from "@/lib/firebase";

/**
 * Lets a reporter message staff directly without a phone call. Deliberately
 * never reads or shows staff presence/online status to the public.
 */
export function SupportRequestCard() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  if (!isFirebaseConfigured) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setResult(null);

    try {
      await createSupportRequest({ message });
      setMessage("");
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-teal-900">
        <MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {t("report.support.title")}
      </h2>
      <p className="mt-2 text-xs leading-5 text-ink-500">{t("report.support.body")}</p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, SUPPORT_MESSAGE_MAX))}
          placeholder={t("report.support.messagePlaceholder")}
          rows={3}
          disabled={sending}
          aria-label={t("report.support.title")}
        />
        <Button type="submit" size="sm" variant="outline" className="w-full" disabled={sending}>
          {sending ? (
            <>
              <Spinner className="h-4 w-4" />
              {t("report.support.sending")}
            </>
          ) : (
            t("report.support.submit")
          )}
        </Button>
      </form>

      {result === "success" ? (
        <p className="mt-2 text-xs font-medium text-success-600" role="status">
          {t("report.support.success")}
        </p>
      ) : null}
      {result === "error" ? (
        <p className="mt-2 text-xs font-medium text-critical-600" role="alert">
          {t("report.support.error")}
        </p>
      ) : null}
    </Card>
  );
}
