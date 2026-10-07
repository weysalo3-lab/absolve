import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge, Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { adminStats } from "@/lib/db/admin";
import { adminListings } from "@/lib/db/listings";
import { getI18n } from "@/lib/i18n/server";
import { photoUrl } from "@/lib/photos";
import { formatMoney } from "@/lib/utils";
import type { ListingStatus, Locale } from "@/lib/types";
import { ListingModeration } from "./listing-moderation";
import { ProviderModerationSection } from "./provider-moderation-section";

/**
 * Moderation: platform numbers, and every listing with the verified badge and
 * take-down controls. requireAdmin sends anyone else away.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { t, href, locale } = await getI18n(params);
  await requireAdmin(locale);

  const [stats, listings] = await Promise.all([
    adminStats().catch(() => null),
    adminListings(locale).catch(() => []),
  ]);

  const statusLabels: Record<ListingStatus, string> = {
    draft: t("host.status.draft"),
    published: t("host.status.published"),
    paused: t("host.status.paused"),
    removed: t("host.status.removed"),
  };

  const statusVariant = (status: ListingStatus) => {
    if (status === "published") return "verified" as const;
    if (status === "paused") return "accent" as const;
    if (status === "removed") return "destructive" as const;
    return "muted" as const;
  };

  const statCards = stats
    ? [
        { label: t("admin.statUsers"), value: stats.users },
        { label: t("admin.statHosts"), value: stats.hosts },
        { label: t("admin.statListings"), value: stats.listings },
        { label: t("admin.statProviders"), value: stats.providers },
        { label: t("admin.statBookings"), value: stats.bookings },
        { label: t("admin.statReviews"), value: stats.reviews },
      ]
    : [];

  return (
    <div className="container max-w-5xl space-y-10 py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("admin.title")}
      </h1>

      {statCards.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">{t("admin.overview")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="tnum font-display text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("admin.listings")}{" "}
          <span className="tnum text-sm font-normal text-muted-foreground">({listings.length})</span>
        </h2>

        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(listing.photos[0] ?? null)}
                  alt={listing.title}
                  className="aspect-[16/10] w-full shrink-0 rounded-xl bg-muted object-cover sm:aspect-[4/3] sm:w-28"
                  loading="lazy"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Only live listings have a public page an admin can open. */}
                    {listing.status === "published" ? (
                      <Link
                        href={href(`/listing/${listing.id}`)}
                        className="line-clamp-1 font-display text-base font-semibold text-foreground hover:text-primary"
                      >
                        {listing.title}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 font-display text-base font-semibold text-foreground">
                        {listing.title}
                      </span>
                    )}
                    <Badge variant={statusVariant(listing.status)}>{statusLabels[listing.status]}</Badge>
                    {listing.verified ? (
                      <Badge variant="verified" className="gap-1">
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        {t("common.verified")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="tnum mt-1 text-sm text-muted-foreground">
                    {listing.hostName} · {[listing.neighborhood, listing.city].filter(Boolean).join(", ")} ·{" "}
                    <span className="font-semibold text-foreground">
                      {formatMoney(listing.price, listing.currency)}
                    </span>
                  </p>
                </div>

                <ListingModeration
                  listingId={listing.id}
                  verified={listing.verified}
                  status={listing.status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ProviderModerationSection locale={locale} />
    </div>
  );
}
