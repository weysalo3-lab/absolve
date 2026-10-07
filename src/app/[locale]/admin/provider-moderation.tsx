"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { adminProviderStatusAction, adminProviderVerifiedAction } from "@/actions/providers";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Publish / pause / take down / verify controls for one directory entry. */
export function ProviderModeration({
  providerId,
  verified,
  status,
}: {
  providerId: string;
  verified: boolean;
  status: string;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean }>) => {
    startTransition(async () => {
      try {
        const res = await action();
        if (!res.ok) toast.error(t("error.generic"));
      } catch {
        toast.error(t("error.generic"));
      }
    });
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {status === "draft" || status === "paused" ? (
        <Button size="sm" disabled={isPending} onClick={() => run(() => adminProviderStatusAction(providerId, "published"))}>
          {t("host.publish")}
        </Button>
      ) : null}
      {status === "published" ? (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => adminProviderStatusAction(providerId, "paused"))}>
          {t("host.pause")}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant={verified ? "outline" : "soft"}
        disabled={isPending}
        onClick={() => run(() => adminProviderVerifiedAction(providerId, !verified))}
      >
        {verified ? t("admin.unverify") : t("admin.verify")}
      </Button>
      {status === "removed" ? (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => adminProviderStatusAction(providerId, "published"))}>
          {t("admin.restore")}
        </Button>
      ) : (
        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => run(() => adminProviderStatusAction(providerId, "removed"))}>
          {t("admin.takeDown")}
        </Button>
      )}
    </div>
  );
}
