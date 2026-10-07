import Link from "next/link";
import { Search, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { i18nFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/types";

/**
 * Text search for the directory (a plain GET form, so results stay a
 * shareable URL) and the "add your business" entry point.
 */
export function ServicesToolbar({
  locale,
  q,
  category,
}: {
  locale: Locale;
  q: string;
  category: string;
}) {
  const { t, href } = i18nFor(locale);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form action={href("/services")} method="get" role="search" className="flex w-full max-w-xl gap-2">
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder={t("services.searchPlaceholder")}
            aria-label={t("common.search")}
            className="pl-10"
          />
        </div>
        <Button type="submit">{t("common.search")}</Button>
      </form>

      <Button asChild variant="soft" className="shrink-0">
        <Link href={href("/host/services/new")}>
          <Store aria-hidden />
          {t("services.addYours")}
        </Link>
      </Button>
    </div>
  );
}
