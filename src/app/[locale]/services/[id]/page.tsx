import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Globe,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getProviderDetail, isOpenNow, providerReviews } from "@/lib/db/providers";
import { coerceLocale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { photoUrl } from "@/lib/photos";
import { serviceCategoryTerm, WEEKDAYS } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";
import { formatDate, formatPhone } from "@/lib/utils";
import { ProviderReviewForm } from "./provider-review-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const provider = await getProviderDetail(id, coerceLocale(locale)).catch(() => null);
  if (!provider) return {};
  return {
    title: provider.name,
    description: provider.description ?? undefined,
    alternates: { canonical: `/${locale}/services/${id}` },
  };
}

/** A business in the directory: hours, contact, location and reviews. */
export default async function ProviderPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { id } = await params;

  const provider = await getProviderDetail(id, locale).catch(() => null);
  if (!provider) notFound();

  const [user, reviews] = await Promise.all([
    getSessionUser(),
    providerReviews(provider.id).catch(() => []),
  ]);

  const term = serviceCategoryTerm(provider.category);
  const category = term ? (locale === "am" ? term.am : term.en) : provider.category;
  const open = isOpenNow(provider);
  const allDay =
    provider.emergency ||
    (provider.opensAt === "00:00" && (provider.closesAt === "23:59" || provider.closesAt === "24:00"));
  const hours = allDay
    ? t("services.open24")
    : provider.opensAt && provider.closesAt
      ? `${provider.opensAt}–${provider.closesAt}`
      : null;
  const days =
    provider.openDays.length === 0 || provider.openDays.length === 7
      ? t("services.everyDay")
      : [...provider.openDays]
          .sort((a, b) => a - b)
          .map((day) => WEEKDAYS[day]?.[locale])
          .filter(Boolean)
          .join(", ");
  const location = [provider.neighborhood, provider.subcity, provider.city].filter(Boolean).join(", ");
  const mapHref = `https://www.openstreetmap.org/?mlat=${provider.lat}&mlon=${provider.lng}#map=17/${provider.lat}/${provider.lng}`;
  const homesHref = href(`/search?lat=${provider.lat}&lng=${provider.lng}&radius=2&sort=distance`);
  const priceLabel =
    provider.priceLevel === 1
      ? t("provider.priceLevel1")
      : provider.priceLevel === 2
        ? t("provider.priceLevel2")
        : provider.priceLevel === 3
          ? t("provider.priceLevel3")
          : null;
  const isOwner = !!user && user.id === provider.ownerId;

  return (
    <div className="container max-w-5xl space-y-6 py-8 sm:py-12">
      <Link
        href={href(`/services?category=${encodeURIComponent(provider.category)}`)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {category}
      </Link>

      <div className="overflow-hidden rounded-3xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${photoUrl(provider.photoKey)}?w=1200&h=500`}
          alt={provider.name}
          className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
              {provider.verified ? (
                <Badge variant="verified" className="gap-1">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  {t("common.verified")}
                </Badge>
              ) : null}
              {provider.emergency ? (
                <Badge variant="destructive" className="gap-1">
                  <Zap className="size-3" aria-hidden />
                  {t("services.emergency")}
                </Badge>
              ) : null}
              {provider.delivery ? (
                <Badge variant="secondary" className="gap-1">
                  <Truck className="size-3" aria-hidden />
                  {t("services.delivery")}
                </Badge>
              ) : null}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {provider.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {provider.ratingCount > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {provider.ratingAvg.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    ({t("common.reviews", { count: provider.ratingCount })})
                  </span>
                </span>
              ) : (
                <span>{t("common.noReviewsYet")}</span>
              )}
              {location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {location}
                </span>
              ) : null}
            </div>
          </div>

          {provider.description ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("services.aboutPlace")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{provider.description}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("services.hours")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className={`inline-flex items-center gap-2 font-medium ${open ? "text-eucalyptus-700" : "text-muted-foreground"}`}>
                <span className={`size-2 rounded-full ${open ? "bg-eucalyptus-500" : "bg-ink-300"}`} aria-hidden />
                {open ? t("services.openNow") : t("services.closedNow")}
              </p>
              {hours ? (
                <p className="tnum flex items-center gap-2 text-ink-700">
                  <Clock className="size-4 text-ink-400" aria-hidden />
                  {hours}
                </p>
              ) : null}
              <p className="text-ink-700">{days}</p>
              {priceLabel ? (
                <p className="text-muted-foreground">
                  {t("services.priceLevel")}: <span className="font-medium text-ink-700">{priceLabel}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("listing.reviews")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("common.noReviewsYet")}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={review.id}>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          name={review.authorName}
                          src={review.authorAvatarKey ? photoUrl(review.authorAvatarKey) : null}
                          className="size-8"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{review.authorName}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                            {review.rating}/5 · {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>
                      ) : null}
                      {index < reviews.length - 1 ? <Separator className="mt-4" /> : null}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {!user ? (
                <Button asChild variant="outline">
                  <Link href={href(`/signin?next=${encodeURIComponent(href(`/services/${provider.id}`))}`)}>
                    {t("services.signInToReview")}
                  </Link>
                </Button>
              ) : isOwner ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">{t("services.ownBusiness")}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={href(`/host/services/${provider.id}`)}>{t("common.edit")}</Link>
                  </Button>
                </div>
              ) : (
                <ProviderReviewForm providerId={provider.id} />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-5">
              {provider.phone ? (
                <Button asChild className="w-full">
                  <a href={`tel:${provider.phone}`}>
                    <Phone aria-hidden />
                    <span className="tnum">{formatPhone(provider.phone)}</span>
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{t("services.noPhone")}</p>
              )}
              {provider.phoneAlt ? (
                <Button asChild variant="soft" className="w-full">
                  <a href={`tel:${provider.phoneAlt}`}>
                    <Phone aria-hidden />
                    <span className="tnum">{formatPhone(provider.phoneAlt)}</span>
                  </a>
                </Button>
              ) : null}
              {provider.website ? (
                <Button asChild variant="outline" className="w-full">
                  <a href={provider.website} target="_blank" rel="noopener noreferrer nofollow">
                    <Globe aria-hidden />
                    {t("services.website")}
                  </a>
                </Button>
              ) : null}

              <Separator />

              {provider.addressLine || location ? (
                <div className="text-sm">
                  <p className="font-medium text-foreground">{t("services.address")}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {[provider.addressLine, location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ) : null}
              <Button asChild variant="ghost" className="w-full">
                <a href={mapHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  {t("services.openDirections")}
                </a>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href={homesHref}>
                  <Home aria-hidden />
                  {t("services.homesNearby")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
