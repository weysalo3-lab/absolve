/**
 * In-app notifications.
 *
 * Written as a side effect of something else (a booking request, an answer,
 * a business going live), so every write here swallows its own errors: a
 * failed notification must never fail the action that caused it.
 *
 * `href` is stored without a locale prefix (/trips, /host) and prefixed at
 * render time, so one row reads correctly in either language.
 */
import { tryGetDB } from "../cf";
import type { Locale, NotificationRow } from "../types";
import { newId } from "../utils";
import { localised, localisedRequired } from "./shared";

export interface NotificationModel {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationInput {
  userId: string;
  kind: string;
  titleEn: string;
  titleAm?: string | null;
  bodyEn?: string | null;
  bodyAm?: string | null;
  href?: string | null;
}

export async function notify(input: NotificationInput): Promise<void> {
  const db = await tryGetDB();
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, kind, title_en, title_am, body_en, body_am, href)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId("ntf"),
        input.userId,
        input.kind,
        input.titleEn,
        input.titleAm ?? null,
        input.bodyEn ?? null,
        input.bodyAm ?? null,
        input.href ?? null,
      )
      .run();
  } catch {
    // Never let a notification break the action that triggered it.
  }
}

/** Fan-out to every administrator, e.g. when a business is waiting for review. */
export async function notifyAdmins(input: Omit<NotificationInput, "userId">): Promise<void> {
  const db = await tryGetDB();
  if (!db) return;
  try {
    const { results } = await db
      .prepare("SELECT id FROM users WHERE is_admin = 1 LIMIT 20")
      .all<{ id: string }>();
    for (const row of results) await notify({ ...input, userId: row.id });
  } catch {
    // Same rule as notify().
  }
}

export async function listNotifications(
  userId: string,
  locale: Locale,
  limit = 20,
): Promise<NotificationModel[]> {
  const db = await tryGetDB();
  if (!db) return [];

  const { results } = await db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(userId, limit)
    .all<NotificationRow>();

  return results.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: localisedRequired(row.title_en, row.title_am, locale),
    body: localised(row.body_en, row.body_am, locale),
    href: row.href,
    read: row.read === 1,
    createdAt: row.created_at,
  }));
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const db = await tryGetDB();
  if (!db) return 0;
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0")
    .bind(userId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = await tryGetDB();
  if (!db) return;
  await db
    .prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0")
    .bind(userId)
    .run();
}

/* -------------------------------------------------------------------------- */
/*  Booking events                                                             */
/* -------------------------------------------------------------------------- */

export type BookingEvent = "requested" | "instant" | "confirmed" | "declined" | "cancelled";

/**
 * Tells the other side of a booking that something happened. `actorId` is
 * who did it, which decides the recipient of a cancellation.
 */
export async function notifyBookingEvent(
  bookingId: string,
  event: BookingEvent,
  actorId: string,
): Promise<void> {
  const db = await tryGetDB();
  if (!db) return;

  try {
    const row = await db
      .prepare(
        `SELECT b.code, b.guest_id, b.host_id, l.title_en, l.title_am, g.full_name AS guest_name
           FROM bookings b
           JOIN listings l ON l.id = b.listing_id
           JOIN users g ON g.id = b.guest_id
          WHERE b.id = ?`,
      )
      .bind(bookingId)
      .first<{
        code: string;
        guest_id: string;
        host_id: string;
        title_en: string;
        title_am: string | null;
        guest_name: string;
      }>();
    if (!row) return;

    const base = {
      kind: `booking.${event}`,
      bodyEn: `${row.code} · ${row.title_en}`,
      bodyAm: `${row.code} · ${row.title_am || row.title_en}`,
    };

    switch (event) {
      case "requested":
        await notify({
          ...base,
          userId: row.host_id,
          titleEn: `New rental request from ${row.guest_name}`,
          titleAm: `ከ${row.guest_name} አዲስ የኪራይ ጥያቄ`,
          href: "/host",
        });
        return;
      case "instant":
        await notify({
          ...base,
          userId: row.host_id,
          titleEn: `${row.guest_name} booked your home`,
          titleAm: `${row.guest_name} ቤትዎን ያዙ`,
          href: "/host",
        });
        return;
      case "confirmed":
        await notify({
          ...base,
          userId: row.guest_id,
          titleEn: "Your rental request was accepted",
          titleAm: "የኪራይ ጥያቄዎ ተቀባይነት አግኝቷል",
          href: "/trips",
        });
        return;
      case "declined":
        await notify({
          ...base,
          userId: row.guest_id,
          titleEn: "Your rental request was declined",
          titleAm: "የኪራይ ጥያቄዎ ተቀባይነት አላገኘም",
          href: "/trips",
        });
        return;
      case "cancelled": {
        const toHost = actorId === row.guest_id;
        await notify({
          ...base,
          userId: toHost ? row.host_id : row.guest_id,
          titleEn: "A rental was cancelled",
          titleAm: "ኪራዩ ተሰርዟል",
          href: toHost ? "/host" : "/trips",
        });
        return;
      }
    }
  } catch {
    // Housekeeping only.
  }
}
