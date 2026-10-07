"use server";

/**
 * Profile edits. Same conventions as the auth actions: validation here,
 * errors as message keys, and the typed values echoed back on failure so the
 * form does not lose them.
 */
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getDB } from "@/lib/cf";
import { coerceLocale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { field } from "@/lib/utils";

export interface ProfileState {
  ok?: boolean;
  error?: MessageKey;
  values?: { fullName: string; city: string; bio: string };
}

const MAX_NAME = 80;
const MAX_CITY = 80;
const MAX_BIO = 500;

export async function updateProfileAction(
  _prev: ProfileState,
  form: FormData,
): Promise<ProfileState> {
  const locale = coerceLocale(field(form, "locale"));
  const user = await requireUser(locale, "/profile");

  const fullName = field(form, "fullName").replace(/\s+/g, " ");
  const city = field(form, "city").slice(0, MAX_CITY);
  const bio = field(form, "bio").slice(0, MAX_BIO);
  const values = { fullName, city, bio };

  if (fullName.length < 2 || fullName.length > MAX_NAME) {
    return { error: "error.nameRequired", values };
  }

  const db = await getDB();
  await db
    .prepare(
      `UPDATE users SET full_name = ?, city = ?, bio = ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(fullName, city || null, bio || null, user.id)
    .run();

  // The name shows in the header, the host dashboard and on listings.
  revalidatePath("/", "layout");
  return { ok: true, values };
}
