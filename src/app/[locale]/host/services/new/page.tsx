import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { coerceLocale } from "@/lib/i18n/config";
import { getI18n, i18nFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/types";
import { ProviderForm } from "../provider-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: i18nFor(coerceLocale(locale)).t("provider.addTitle"), robots: { index: false } };
}

/** Anyone signed in can submit a business; an admin publishes it. */
export default async function NewProviderPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const user = await getSessionUser();
  if (!user) redirect(href(`/signin?next=${encodeURIComponent(href("/host/services/new"))}`));

  return (
    <div className="container max-w-3xl space-y-6 py-8 sm:py-12">
      <Link
        href={href("/host")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("nav.hostDashboard")}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("provider.addTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("services.addYoursBody")}</p>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 px-4 py-3 text-sm text-ink-700">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {t("provider.reviewNote")}
      </p>

      <ProviderForm locale={locale} />
    </div>
  );
}
