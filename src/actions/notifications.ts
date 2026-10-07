"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/db/notifications";
import { coerceLocale } from "@/lib/i18n/config";

/** Bound to a form on the profile page: `action={markAll.bind(null, locale)}`. */
export async function markAllNotificationsReadAction(locale: string): Promise<void> {
  const user = await requireUser(coerceLocale(locale), "/profile");
  await markAllNotificationsRead(user.id);
  revalidatePath("/[locale]/profile", "page");
}
