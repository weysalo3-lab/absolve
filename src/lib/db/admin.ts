/**
 * Platform-wide numbers for the admin overview. One round trip: each count is
 * a scalar subquery, and every table involved is indexed on the filtered column.
 */
import { tryGetDB } from "../cf";

export interface AdminStats {
  users: number;
  hosts: number;
  listings: number;
  providers: number;
  bookings: number;
  reviews: number;
}

export async function adminStats(): Promise<AdminStats> {
  const empty: AdminStats = { users: 0, hosts: 0, listings: 0, providers: 0, bookings: 0, reviews: 0 };
  const db = await tryGetDB();
  if (!db) return empty;

  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM users WHERE is_host = 1) AS hosts,
         (SELECT COUNT(*) FROM listings WHERE status = 'published') AS listings,
         (SELECT COUNT(*) FROM providers WHERE status = 'published') AS providers,
         (SELECT COUNT(*) FROM bookings) AS bookings,
         (SELECT COUNT(*) FROM reviews) AS reviews`,
    )
    .first<AdminStats>();

  return row ?? empty;
}
