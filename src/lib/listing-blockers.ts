/**
 * Human labels for the keys `publishBlockers` returns. Kept apart from the
 * database module so client components (the publish button) can use it too.
 */
import type { MessageKey, Translator } from "./i18n/messages";

const BLOCKER_LABELS: Record<string, MessageKey> = {
  title: "wizard.titleLabel",
  summary: "wizard.summaryLabel",
  description: "wizard.descriptionLabel",
  city: "wizard.cityLabel",
  neighborhood: "wizard.areaLabel",
  price: "wizard.step.price",
  photos: "wizard.step.photos",
};

/** ["title", "photos"] -> "Give it a short title, Photos" in the active language. */
export function blockerLabels(keys: string[], t: Translator): string {
  return keys
    .map((key) => (key in BLOCKER_LABELS ? t(BLOCKER_LABELS[key]) : key))
    .join(", ");
}
