"use server";

/**
 * Services directory actions: owners add and edit their business, anyone
 * signed in rates one, and admins moderate.
 *
 * Same conventions as the other actions: validation here, errors as message
 * keys, and the typed values echoed back so a failed submit does not wipe
 * the form.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requireUser } from "@/lib/auth";
import { notify, notifyAdmins } from "@/lib/db/notifications";
import {
  createProvider,
  getOwnedProvider,
  getProviderDetail,
  getProviderRow,
  rateProvider,
  setProviderStatus,
  setProviderVerified,
  updateProvider,
} from "@/lib/db/providers";
import { coerceLocale, localeHref } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { SERVICE_CATEGORY_MAP } from "@/lib/taxonomy";
import { boolField, field } from "@/lib/utils";

export interface ProviderFormState {
  ok?: boolean;
  error?: MessageKey;
  values?: Record<string, string>;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_NAME = 120;
const MAX_TEXT = 2000;
const MAX_SHORT = 120;

/**
 * Businesses use landlines too (011…), so this is looser than the account
 * phone rule: any 9-digit Ethiopian number, normalised to +251XXXXXXXXX.
 * Returns null when empty and false when it is not a valid number.
 */
function businessPhone(raw: string): string | null | false {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  const match = /^(?:\+251|251|0)?([1-9]\d{8})$/.exec(digits);
  return match ? `+251${match[1]}` : false;
}

/** Adds https:// when missing; rejects anything that does not parse as a host. */
function websiteUrl(raw: string): string | null | false {
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return false;
    return url.toString();
  } catch {
    return false;
  }
}

/** Every string field, multi-value fields joined with commas. */
function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    values[key] = key in values ? `${values[key]},${value}` : value;
  }
  return values;
}

interface ParsedProvider {
  nameEn: string;
  nameAm: string | null;
  category: string;
  descriptionEn: string | null;
  descriptionAm: string | null;
  phone: string | null;
  phoneAlt: string | null;
  website: string | null;
  city: string;
  subcity: string | null;
  neighborhood: string | null;
  addressLine: string | null;
  lat: number;
  lng: number;
  opensAt: string | null;
  closesAt: string | null;
  openDays: number[];
  priceLevel: number | null;
  delivery: boolean;
  emergency: boolean;
}

function parseProvider(form: FormData): { data: ParsedProvider } | { error: MessageKey } {
  const opt = (key: string, max = MAX_SHORT): string | null => field(form, key).slice(0, max) || null;

  const nameEn = field(form, "nameEn").replace(/\s+/g, " ").slice(0, MAX_NAME);
  if (nameEn.length < 2) return { error: "error.required" };

  const category = field(form, "category");
  if (!(category in SERVICE_CATEGORY_MAP)) return { error: "error.categoryRequired" };

  const phone = businessPhone(field(form, "phone"));
  const phoneAlt = businessPhone(field(form, "phoneAlt"));
  if (phone === false || phoneAlt === false) return { error: "error.invalidPhone" };

  const website = websiteUrl(field(form, "website"));
  if (website === false) return { error: "error.invalidWebsite" };

  const rawLat = field(form, "lat");
  const rawLng = field(form, "lng");
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  // Roughly Ethiopia's bounding box: catches swapped or default-zero coordinates.
  if (!rawLat || !rawLng || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 3 || lat > 15 || lng < 33 || lng > 48) {
    return { error: "error.locationRequired" };
  }

  const emergency = boolField(form, "emergency");
  const opensAt = field(form, "opensAt") || null;
  const closesAt = field(form, "closesAt") || null;
  if ((opensAt && !TIME_PATTERN.test(opensAt)) || (closesAt && !TIME_PATTERN.test(closesAt))) {
    return { error: "error.invalidTime" };
  }
  if (!emergency && !opensAt !== !closesAt) return { error: "error.invalidTime" };

  const openDays = Array.from(
    new Set(
      form
        .getAll("openDays")
        .map((value) => Number(value))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ).sort((a, b) => a - b);

  const level = Number(field(form, "priceLevel"));
  const priceLevel = Number.isInteger(level) && level >= 1 && level <= 3 ? level : null;

  return {
    data: {
      nameEn,
      nameAm: opt("nameAm", MAX_NAME),
      category,
      descriptionEn: opt("descriptionEn", MAX_TEXT),
      descriptionAm: opt("descriptionAm", MAX_TEXT),
      phone,
      phoneAlt,
      website,
      city: opt("city") || "Addis Ababa",
      subcity: opt("subcity"),
      neighborhood: opt("neighborhood"),
      addressLine: opt("addressLine", 200),
      lat,
      lng,
      opensAt: emergency && !opensAt ? "00:00" : opensAt,
      closesAt: emergency && !closesAt ? "23:59" : closesAt,
      openDays: openDays.length ? openDays : [0, 1, 2, 3, 4, 5, 6],
      priceLevel,
      delivery: boolField(form, "delivery"),
      emergency,
    },
  };
}

function refreshDirectory(): void {
  revalidatePath("/[locale]/host", "page");
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/services", "page");
  revalidatePath("/[locale]/services/[id]", "page");
}

/** Creates (as a draft awaiting review) or edits a business the user owns. */
export async function saveProviderAction(
  _prev: ProviderFormState,
  form: FormData,
): Promise<ProviderFormState> {
  const locale = coerceLocale(field(form, "locale"));
  const providerId = field(form, "providerId");
  const user = await requireUser(
    locale,
    providerId ? `/host/services/${providerId}` : "/host/services/new",
  );

  const values = echo(form);
  const parsed = parseProvider(form);
  if ("error" in parsed) return { error: parsed.error, values };
  const d = parsed.data;

  if (providerId) {
    const owned = await getOwnedProvider(providerId, user.id);
    if (!owned) return { error: "error.notAllowed", values };

    const saved = await updateProvider(providerId, user.id, {
      name_en: d.nameEn,
      name_am: d.nameAm,
      category: d.category,
      description_en: d.descriptionEn,
      description_am: d.descriptionAm,
      phone: d.phone,
      phone_alt: d.phoneAlt,
      website: d.website,
      address_line: d.addressLine,
      city: d.city,
      subcity: d.subcity,
      neighborhood: d.neighborhood,
      lat: d.lat,
      lng: d.lng,
      opens_at: d.opensAt,
      closes_at: d.closesAt,
      open_days: JSON.stringify(d.openDays),
      price_level: d.priceLevel,
      delivery: d.delivery ? 1 : 0,
      emergency_24_7: d.emergency ? 1 : 0,
    });
    if (!saved) return { error: "error.generic", values };

    refreshDirectory();
    return { ok: true, values };
  }

  const id = await createProvider({
    ownerId: user.id,
    nameEn: d.nameEn,
    nameAm: d.nameAm,
    category: d.category,
    descriptionEn: d.descriptionEn,
    descriptionAm: d.descriptionAm,
    phone: d.phone,
    city: d.city,
    subcity: d.subcity,
    neighborhood: d.neighborhood,
    addressLine: d.addressLine,
    lat: d.lat,
    lng: d.lng,
    opensAt: d.opensAt,
    closesAt: d.closesAt,
    openDays: d.openDays,
    delivery: d.delivery,
    emergency: d.emergency,
  });
  // createProvider does not take these three; set them in a follow-up write.
  await updateProvider(id, user.id, {
    phone_alt: d.phoneAlt,
    website: d.website,
    price_level: d.priceLevel,
  });

  await notifyAdmins({
    kind: "provider.submitted",
    titleEn: `New business waiting for review: ${d.nameEn}`,
    titleAm: `ግምገማ የሚጠብቅ አዲስ ንግድ፦ ${d.nameAm || d.nameEn}`,
    href: "/admin",
  });

  refreshDirectory();
  redirect(localeHref(locale, `/host/services/${id}?created=1`));
}

/** One rating per person per place, upserted by rateProvider. */
export async function rateProviderAction(
  _prev: ProviderFormState,
  form: FormData,
): Promise<ProviderFormState> {
  const locale = coerceLocale(field(form, "locale"));
  const providerId = field(form, "providerId");
  const user = await requireUser(locale, `/services/${providerId}`);

  const rating = Number(field(form, "rating"));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "review.ratingRequired" };
  }

  const provider = await getProviderDetail(providerId, locale);
  if (!provider) return { error: "error.notFound" };
  if (provider.ownerId === user.id) return { error: "error.notAllowed" };

  await rateProvider(providerId, user.id, rating, field(form, "comment").slice(0, 1000) || null);

  revalidatePath("/[locale]/services/[id]", "page");
  revalidatePath("/[locale]/services", "page");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  Admin moderation                                                           */
/* -------------------------------------------------------------------------- */

export async function adminProviderStatusAction(
  providerId: string,
  status: "published" | "paused" | "removed",
): Promise<{ ok: boolean }> {
  await requireAdmin("en");
  if (status !== "published" && status !== "paused" && status !== "removed") return { ok: false };

  const row = await getProviderRow(providerId);
  if (!row) return { ok: false };

  await setProviderStatus(providerId, status);

  if (status === "published" && row.status !== "published" && row.owner_id) {
    await notify({
      userId: row.owner_id,
      kind: "provider.published",
      titleEn: `${row.name_en} is now live on Kiray`,
      titleAm: `${row.name_am || row.name_en} በኪራይ ላይ ታትሟል`,
      href: `/services/${row.id}`,
    });
  }

  refreshDirectory();
  return { ok: true };
}

export async function adminProviderVerifiedAction(
  providerId: string,
  verified: boolean,
): Promise<{ ok: boolean }> {
  await requireAdmin("en");
  const row = await getProviderRow(providerId);
  if (!row) return { ok: false };
  await setProviderVerified(providerId, verified === true);
  refreshDirectory();
  return { ok: true };
}
