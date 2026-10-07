import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Info } from "lucide-react";

import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { getOwnedProvider } from "@/lib/db/providers";
import { coerceLocale } from "@/lib/i18n/config";
import { getI18n, i18nFor } from "@/lib/i18n/server";
import type { RawSearchParams } from "@/lib/search";
import type { Locale } from "@/lib/types";
import { formatPhone, safeJSON } from "@/lib/utils";
import { ProviderForm, type ProviderFormInitial } from "../provider-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: i18nFor(coerceLocale(locale)).t("provider.editTitle"), robots: { index: false } };
}

export default async function EditProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { id } = await params;
  const query = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(href(`/signin?next=${encodeURIComponent(href(`/host/services/${id}`))}`));

  const row = await getOwnedProvider(id, user.id);
  if (!row) notFound();

  const initial: ProviderFormInitial = {
    id: row.id,
    nameEn: row.name_en,
    nameAm: row.name_am ?? "",
    category: row.category,
    descriptionEn: row.description_en ?? "",
    descriptionAm: row.description_am ?? "",
    phone: formatPhone(row.phone),
    phoneAlt: formatPhone(row.phone_alt),
    website: row.website ?? "",
    city: row.city,
    subcity: row.subcity ?? "",
    neighborhood: row.neighborhood ?? "",
    addressLine: row.address_line ?? "",
    lat: String(row.lat),
    lng: String(row.lng),
    opensAt: row.opens_at ?? "",
    closesAt: row.closes_at ?? "",
    openDays: safeJSON<number[]>(row.open_days, [0, 1, 2, 3, 4, 5, 6]),
    priceLevel: row.price_level ? String(row.price_level) : "",
    delivery: row.delivery === 1,
    emergency: row.emergency_24_7 === 1,
  };

  const statusLabel: Record<string, string> = {
    draft: t("provider.pendingReview"),
    published: t("host.status.published"),
    paused: t("host.status.paused"),
    removed: t("host.status.removed"),
  };
  const statusVariant =
    row.status === "published" ? "verified" : row.status === "removed" ? "destructive" : row.status === "paused" ? "accent" : "muted";

  return (
    <div className="container max-w-3xl space-y-6 py-8 sm:py-12">
      <Link
        href={href("/host")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("nav.hostDashboard")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("provider.editTitle")}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-ink-700">{row.name_en}</span>
            <Badge variant={statusVariant}>{statusLabel[row.status] ?? row.status}</Badge>
          </div>
        </div>
        {row.status === "published" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(`/services/${row.id}`)}>
              <ExternalLink aria-hidden />
              {t("provider.viewPublic")}
            </Link>
          </Button>
        ) : null}
      </div>

      {query.created ? (
        <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 px-4 py-3 text-sm text-ink-700" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t("provider.saved")}. {t("provider.reviewNote")}
        </p>
      ) : row.status === "draft" ? (
        <p className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-ink-700">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-500" aria-hidden />
          {t("provider.reviewNote")}
        </p>
      ) : null}

      <ProviderForm locale={locale} initial={initial} />
    </div>
  );
}
