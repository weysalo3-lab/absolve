import Link from "next/link";
import { Bell } from "lucide-react";

import { markAllNotificationsReadAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listNotifications } from "@/lib/db/notifications";
import { i18nFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

/** The latest notifications, with a one-click "mark all read". */
export async function NotificationsCard({ userId, locale }: { userId: string; locale: Locale }) {
  const { t, href } = i18nFor(locale);
  const items = await listNotifications(userId, locale).catch(() => []);
  const unread = items.filter((item) => !item.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          {t("profile.notifications")}
          {unread > 0 ? (
            <Badge variant="verified" className="tnum">
              {unread}
            </Badge>
          ) : null}
        </CardTitle>
        {unread > 0 ? (
          <form action={markAllNotificationsReadAction.bind(null, locale)}>
            <Button type="submit" variant="ghost" size="sm">
              {t("profile.markAllRead")}
            </Button>
          </form>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="size-4" aria-hidden />
            {t("profile.noNotifications")}
          </p>
        ) : (
          <ul className="-mx-2 divide-y divide-border">
            {items.map((item) => {
              const inner = (
                <span className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.read ? "bg-transparent" : "bg-berbere",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm text-foreground", !item.read && "font-semibold")}>
                      {item.title}
                    </span>
                    {item.body ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.body}</span>
                    ) : null}
                    <span className="tnum mt-0.5 block text-[11px] text-ink-400">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </span>
                </span>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={href(item.href)} className="block rounded-xl px-2 py-3 transition-colors hover:bg-muted/60">
                      {inner}
                    </Link>
                  ) : (
                    <div className="px-2 py-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
