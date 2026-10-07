"use server";

/**
 * Admin moderation actions. requireAdmin redirects anyone else, so the checks
 * here are about input shape, not permission.
 */
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { adminSetListingStatus, setListingVerified } from "@/lib/db/listings";

function refresh(): void {
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/", "layout");
}

export async function setListingVerifiedAction(
  listingId: string,
  verified: boolean,
): Promise<{ ok: boolean }> {
  await requireAdmin("en");
  const ok = await setListingVerified(listingId, verified === true);
  if (ok) refresh();
  return { ok };
}

export async function adminListingStatusAction(
  listingId: string,
  status: "paused" | "removed",
): Promise<{ ok: boolean }> {
  await requireAdmin("en");
  if (status !== "paused" && status !== "removed") return { ok: false };
  const ok = await adminSetListingStatus(listingId, status);
  if (ok) refresh();
  return { ok };
}
