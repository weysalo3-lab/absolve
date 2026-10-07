import { notFound } from "next/navigation";

/**
 * Unknown paths under a locale (/en/does-not-exist) would otherwise fall
 * through to Next's bare default 404, outside this layout. Sending them
 * through notFound() renders the localised not-found page with the header,
 * footer and tab bar.
 */
export default function CatchAllNotFound() {
  notFound();
}
