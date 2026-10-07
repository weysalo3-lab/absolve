"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { adminListingStatusAction, setListingVerifiedAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import type { ListingStatus } from "@/lib/types";

/** Verify / take down controls for one listing row. */
export function ListingModeration({
  listingId,
  verified,
  status,
}: {
  listingId: string;
  verified: boolean;
  status: ListingStatus;
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
      <Button
        size="sm"
        variant={verified ? "outline" : "soft"}
        disabled={isPending}
        onClick={() => run(() => setListingVerifiedAction(listingId, !verified))}
      >
        {verified ? t("admin.unverify") : t("admin.verify")}
      </Button>
      {status === "removed" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => adminListingStatusAction(listingId, "paused"))}
        >
          {t("admin.restore")}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => run(() => adminListingStatusAction(listingId, "removed"))}
        >
          {t("admin.takeDown")}
        </Button>
      )}
    </div>
  );
}
