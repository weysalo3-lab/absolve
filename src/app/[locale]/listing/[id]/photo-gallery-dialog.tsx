"use client";

import { Images } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";
import { photoUrl } from "@/lib/photos";

/**
 * Every photo of a listing. The page itself shows at most five (one on
 * phones), so without this a host's sixth to twentieth upload is invisible.
 */
export function PhotoGalleryDialog({
  title,
  photos,
  alts,
}: {
  title: string;
  photos: string[];
  alts: string[];
}) {
  const { t } = useI18n();
  const label = t("listing.allPhotos", { count: photos.length });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="tnum absolute bottom-3 right-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Images className="size-3.5" aria-hidden />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map((key, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${key}-${index}`}
              src={photoUrl(key)}
              alt={alts[index] || title}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-xl bg-muted object-cover"
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
