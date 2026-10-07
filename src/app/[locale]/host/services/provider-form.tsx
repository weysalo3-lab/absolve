"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { saveProviderAction, type ProviderFormState } from "@/actions/providers";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/client";
import { SERVICE_CATEGORIES, WEEKDAYS } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

export interface ProviderFormInitial {
  id?: string;
  nameEn: string;
  nameAm: string;
  category: string;
  descriptionEn: string;
  descriptionAm: string;
  phone: string;
  phoneAlt: string;
  website: string;
  city: string;
  subcity: string;
  neighborhood: string;
  addressLine: string;
  lat: string;
  lng: string;
  opensAt: string;
  closesAt: string;
  openDays: number[];
  priceLevel: string;
  delivery: boolean;
  emergency: boolean;
}

/** Defaults for a new business: central Addis, open every day. */
const BLANK: ProviderFormInitial = {
  nameEn: "",
  nameAm: "",
  category: "",
  descriptionEn: "",
  descriptionAm: "",
  phone: "",
  phoneAlt: "",
  website: "",
  city: "Addis Ababa",
  subcity: "",
  neighborhood: "",
  addressLine: "",
  lat: "9.0108",
  lng: "38.7613",
  opensAt: "08:00",
  closesAt: "20:00",
  openDays: [0, 1, 2, 3, 4, 5, 6],
  priceLevel: "",
  delivery: false,
  emergency: false,
};

const checkboxClass = "size-5 shrink-0 rounded border-ink-300 accent-primary";
const fieldsetClass = "space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6";
const legendClass = "px-1 font-display text-base font-semibold text-foreground";

/**
 * Add / edit a business. Plain inputs post straight to the server action; on a
 * validation error the action echoes the values back so nothing is lost when
 * React resets the form.
 */
export function ProviderForm({
  locale,
  initial = BLANK,
}: {
  locale: Locale;
  initial?: ProviderFormInitial;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<ProviderFormState, FormData>(
    saveProviderAction,
    {},
  );
  const [lat, setLat] = useState(initial.lat);
  const [lng, setLng] = useState(initial.lng);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (state.ok) toast.success(t("provider.saved"));
  }, [state, t]);

  const echoed = state.values;
  const text = (name: string, fallback: string) => (echoed ? (echoed[name] ?? "") : fallback);
  const checked = (name: string, fallback: boolean) => (echoed ? echoed[name] === "on" : fallback);
  const days = echoed
    ? (echoed.openDays ?? "").split(",").filter(Boolean).map(Number)
    : initial.openDays;

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error(t("search.locationDenied"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error(t("search.locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const mapHref = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=17/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="providerId" value={initial.id} /> : null}

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{t("wizard.step.basics")}</legend>

        <Field label={t("provider.nameEn")} htmlFor="prv-nameEn" required>
          <Input id="prv-nameEn" name="nameEn" required maxLength={120} defaultValue={text("nameEn", initial.nameEn)} />
        </Field>
        <Field label={t("provider.nameAm")} htmlFor="prv-nameAm" hint={t("common.optional")}>
          <Input id="prv-nameAm" name="nameAm" lang="am" maxLength={120} defaultValue={text("nameAm", initial.nameAm)} />
        </Field>
        <Field label={t("provider.category")} htmlFor="prv-category" required>
          <NativeSelect id="prv-category" name="category" required defaultValue={text("category", initial.category)}>
            <option value="" disabled>
              {t("services.category")}
            </option>
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {locale === "am" ? category.am : category.en}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("provider.descriptionEn")} htmlFor="prv-descriptionEn">
          <Textarea id="prv-descriptionEn" name="descriptionEn" rows={3} maxLength={2000} defaultValue={text("descriptionEn", initial.descriptionEn)} />
        </Field>
        <Field label={t("provider.descriptionAm")} htmlFor="prv-descriptionAm" hint={t("common.optional")}>
          <Textarea id="prv-descriptionAm" name="descriptionAm" lang="am" rows={3} maxLength={2000} defaultValue={text("descriptionAm", initial.descriptionAm)} />
        </Field>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{t("provider.locationTitle")}</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("wizard.cityLabel")} htmlFor="prv-city">
            <Input id="prv-city" name="city" maxLength={120} defaultValue={text("city", initial.city)} />
          </Field>
          <Field label={t("wizard.subcityLabel")} htmlFor="prv-subcity">
            <Input id="prv-subcity" name="subcity" maxLength={120} defaultValue={text("subcity", initial.subcity)} />
          </Field>
          <Field label={t("wizard.areaLabel")} htmlFor="prv-neighborhood">
            <Input id="prv-neighborhood" name="neighborhood" maxLength={120} defaultValue={text("neighborhood", initial.neighborhood)} />
          </Field>
          <Field label={t("services.address")} htmlFor="prv-address">
            <Input id="prv-address" name="addressLine" maxLength={200} defaultValue={text("addressLine", initial.addressLine)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("wizard.latitude")} htmlFor="prv-lat" required>
            <Input id="prv-lat" name="lat" type="number" step="any" inputMode="decimal" required value={lat} onChange={(event) => setLat(event.target.value)} />
          </Field>
          <Field label={t("wizard.longitude")} htmlFor="prv-lng" required>
            <Input id="prv-lng" name="lng" type="number" step="any" inputMode="decimal" required value={lng} onChange={(event) => setLng(event.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-ink-400">{t("wizard.locationHint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="soft" size="sm" onClick={locate} loading={locating}>
            {!locating ? <LocateFixed aria-hidden /> : null}
            {t("wizard.useMyLocation")}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={mapHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              {t("common.viewOnMap")}
            </a>
          </Button>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{t("provider.contactTitle")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("provider.phoneLabel")} htmlFor="prv-phone">
            <Input id="prv-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="011 662 0000" defaultValue={text("phone", initial.phone)} />
          </Field>
          <Field label={t("provider.phoneAltLabel")} htmlFor="prv-phoneAlt" hint={t("common.optional")}>
            <Input id="prv-phoneAlt" name="phoneAlt" type="tel" inputMode="tel" defaultValue={text("phoneAlt", initial.phoneAlt)} />
          </Field>
        </div>
        <Field label={t("provider.websiteLabel")} htmlFor="prv-website" hint={t("common.optional")}>
          <Input id="prv-website" name="website" type="url" inputMode="url" placeholder="https://" defaultValue={text("website", initial.website)} />
        </Field>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{t("provider.hours")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("provider.opensAt")} htmlFor="prv-opens">
            <Input id="prv-opens" name="opensAt" type="time" defaultValue={text("opensAt", initial.opensAt)} />
          </Field>
          <Field label={t("provider.closesAt")} htmlFor="prv-closes">
            <Input id="prv-closes" name="closesAt" type="time" defaultValue={text("closesAt", initial.closesAt)} />
          </Field>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-ink-800">{t("provider.openDays")}</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, index) => (
              <label key={day.en} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-sm has-[:checked]:border-primary/40 has-[:checked]:bg-primary-soft">
                <input type="checkbox" name="openDays" value={String(index)} defaultChecked={days.includes(index)} className={checkboxClass} />
                {locale === "am" ? day.am : day.en}
              </label>
            ))}
          </div>
        </div>

        <Field label={t("provider.priceLevelLabel")} htmlFor="prv-price">
          <NativeSelect id="prv-price" name="priceLevel" defaultValue={text("priceLevel", initial.priceLevel)}>
            <option value="">{t("common.any")}</option>
            <option value="1">{t("provider.priceLevel1")}</option>
            <option value="2">{t("provider.priceLevel2")}</option>
            <option value="3">{t("provider.priceLevel3")}</option>
          </NativeSelect>
        </Field>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
          <input type="checkbox" name="delivery" defaultChecked={checked("delivery", initial.delivery)} className={checkboxClass} />
          {t("provider.deliveryLabel")}
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
          <input type="checkbox" name="emergency" defaultChecked={checked("emergency", initial.emergency)} className={checkboxClass} />
          {t("provider.emergencyLabel")}
        </label>
      </fieldset>

      {state.error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          {t(state.error)}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={pending}>
        {initial.id ? t("common.saveChanges") : t("host.addService")}
      </Button>
    </form>
  );
}
