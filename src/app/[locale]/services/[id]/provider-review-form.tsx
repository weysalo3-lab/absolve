"use client";

import { useActionState, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { rateProviderAction, type ProviderFormState } from "@/actions/providers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/client";

/** Rate a place. Submitting again updates the person's earlier rating. */
export function ProviderReviewForm({ providerId }: { providerId: string }) {
  const { t, locale } = useI18n();
  const [rating, setRating] = useState(5);
  const [state, formAction, pending] = useActionState<ProviderFormState, FormData>(
    rateProviderAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast.success(t("review.thanks"));
  }, [state, t]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-800">{t("services.reviewPlace")}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}/5`}
              aria-pressed={n === rating}
              className="rounded-md p-1"
            >
              <Star
                className={`size-7 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-ink-200"}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea name="comment" rows={3} maxLength={1000} placeholder={t("review.comment")} />

      {state.error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {t(state.error)}
        </p>
      ) : null}

      <Button type="submit" loading={pending}>
        {t("review.submit")}
      </Button>
    </form>
  );
}
