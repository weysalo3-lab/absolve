"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateProfileAction, type ProfileState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/types";

/** Name, city and bio. Phone changes need verification, so they are not here. */
export function ProfileForm({
  locale,
  fullName,
  city,
  bio,
}: {
  locale: Locale;
  fullName: string;
  city: string | null;
  bio: string | null;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast.success(t("profile.saved"));
  }, [state, t]);

  const values = state.values;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <Field
        label={t("auth.fullName")}
        htmlFor="profile-name"
        required
        error={state.error ? t(state.error) : null}
      >
        <Input
          id="profile-name"
          name="fullName"
          autoComplete="name"
          maxLength={80}
          required
          defaultValue={values?.fullName ?? fullName}
        />
      </Field>

      <Field label={t("auth.city")} htmlFor="profile-city">
        <Input
          id="profile-city"
          name="city"
          autoComplete="address-level2"
          maxLength={80}
          defaultValue={values?.city ?? city ?? ""}
        />
      </Field>

      <Field label={t("profile.about")} htmlFor="profile-bio">
        <Textarea
          id="profile-bio"
          name="bio"
          rows={3}
          maxLength={500}
          placeholder={t("profile.aboutPlaceholder")}
          defaultValue={values?.bio ?? bio ?? ""}
        />
      </Field>

      <Button type="submit" loading={pending}>
        {t("common.saveChanges")}
      </Button>
    </form>
  );
}
