import Link from "next/link";
import { Plus, Store } from "lucide-react";

import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ownedProvidersWithStatus } from "@/lib/db/providers";
import { i18nFor } from "@/lib/i18n/server";
import { photoUrl } from "@/lib/photos";
import { serviceCategoryTerm } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

/** "Your businesses" on the host dashboard. Fetches its own data. */
export async function BusinessesSection({ userId, locale }: { userId: string; locale: Locale }) {
  const { t, href } = i18nFor(locale);
  const businesses = await ownedProvidersWithStatus(userId, locale).catch(() => []);

  const statusLabel: Record<string, string> = {
    draft: t("provider.pendingReview"),
    published: t("host.status.published"),
    paused: t("host.status.paused"),
    removed: t("host.status.removed"),
  };
  const statusVariant = (status: string) =>
    status === "published"
      ? ("verified" as const)
      : status === "removed"
        ? ("destructive" as const)
        : status === "paused"
          ? ("accent" as const)
          : ("muted" as const);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("host.myServices")}{" "}
          {businesses.length > 0 ? (
            <span className="tnum text-sm font-normal text-muted-foreground">({businesses.length})</span>
          ) : null}
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href={href("/host/services/new")}>
            <Plus aria-hidden />
            {t("host.addService")}
          </Link>
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Store className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{t("host.noServices")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("host.noServicesBody")}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {businesses.map((business) => {
            const term = serviceCategoryTerm(business.category);
            const category = term ? (locale === "am" ? term.am : term.en) : business.category;
            return (
              <Card key={business.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(business.photoKey)}
                    alt={business.name}
                    className="aspect-[16/10] w-full shrink-0 rounded-xl bg-muted object-cover sm:aspect-[4/3] sm:w-28"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 font-display text-base font-semibold text-foreground">
                        {business.name}
                      </span>
                      <Badge variant={statusVariant(business.status)}>
                        {statusLabel[business.status] ?? business.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[category, business.neighborhood, business.city].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={href(`/host/services/${business.id}`)}>{t("common.edit")}</Link>
                    </Button>
                    {business.status === "published" ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={href(`/services/${business.id}`)}>{t("listing.view")}</Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
