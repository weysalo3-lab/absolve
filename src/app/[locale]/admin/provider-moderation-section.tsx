import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge, Card, CardContent } from "@/components/ui/card";
import { adminProviders } from "@/lib/db/providers";
import { i18nFor } from "@/lib/i18n/server";
import { photoUrl } from "@/lib/photos";
import { serviceCategoryTerm } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";
import { ProviderModeration } from "./provider-moderation";

/** Services directory moderation. Submissions awaiting review come first. */
export async function ProviderModerationSection({ locale }: { locale: Locale }) {
  const { t, href } = i18nFor(locale);
  const providers = await adminProviders(locale).catch(() => []);
  const waiting = providers.filter((provider) => provider.status === "draft").length;

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
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        {t("admin.providers")}
        <span className="tnum text-sm font-normal text-muted-foreground">({providers.length})</span>
        {waiting > 0 ? (
          <span className="tnum grid h-6 min-w-6 place-items-center rounded-full bg-accent px-2 text-xs font-semibold text-accent-foreground">
            {waiting}
          </span>
        ) : null}
      </h2>

      <div className="space-y-3">
        {providers.map((provider) => {
          const term = serviceCategoryTerm(provider.category);
          const category = term ? (locale === "am" ? term.am : term.en) : provider.category;
          return (
            <Card key={provider.id} className={provider.status === "draft" ? "border-accent/40" : undefined}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(provider.photoKey)}
                  alt={provider.name}
                  className="aspect-[16/10] w-full shrink-0 rounded-xl bg-muted object-cover sm:aspect-[4/3] sm:w-28"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {provider.status === "published" ? (
                      <Link
                        href={href(`/services/${provider.id}`)}
                        className="line-clamp-1 font-display text-base font-semibold text-foreground hover:text-primary"
                      >
                        {provider.name}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 font-display text-base font-semibold text-foreground">
                        {provider.name}
                      </span>
                    )}
                    <Badge variant={statusVariant(provider.status)}>
                      {statusLabel[provider.status] ?? provider.status}
                    </Badge>
                    {provider.verified ? (
                      <Badge variant="verified" className="gap-1">
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        {t("common.verified")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[category, provider.ownerName, [provider.neighborhood, provider.city].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <ProviderModeration providerId={provider.id} verified={provider.verified} status={provider.status} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
