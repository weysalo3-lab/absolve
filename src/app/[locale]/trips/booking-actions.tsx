"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelBookingAction } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";
import type { BookingStatus } from "@/lib/types";

/** Cancel button with a confirmation step, for pending or confirmed stays. */
export function BookingActions({
  bookingId,
  status,
  startDate,
}: {
  bookingId: string;
  status: BookingStatus;
  /** YYYY-MM-DD; once the stay has started the server refuses to cancel. */
  startDate?: string;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (status !== "pending" && status !== "confirmed") return null;
  // Matches cancelBooking's `start_date > date('now')` (UTC): hide the button
  // rather than offer an action that can only fail.
  if (startDate && startDate <= new Date().toISOString().slice(0, 10)) return null;

  const confirmCancel = () => {
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId, locale);
      if (res.ok) {
        setOpen(false);
        toast.success(t("booking.status.cancelled"));
      } else {
        toast.error(t(res.error ?? "error.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          {t("booking.cancel")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("booking.cancelConfirm")}</DialogTitle>
          <DialogDescription>{t("booking.cancelBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.back")}
          </Button>
          <Button variant="destructive" onClick={confirmCancel} loading={isPending}>
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
