"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeListingAction } from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";

/** Removes the listing after a confirmation, then returns to the dashboard. */
export function DeleteListingButton({ listingId }: { listingId: string }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    try {
      const res = await removeListingAction(listingId);
      if (res.ok) {
        toast.success(t("host.status.removed"));
        router.push(href("/host"));
      } else {
        toast.error(t(res.error ?? "error.generic"));
      }
    } catch {
      toast.error(t("error.generic"));
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
        {t("common.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("host.deleteConfirm")}
        description={t("host.deleteBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirm}
        destructive
      />
    </>
  );
}
