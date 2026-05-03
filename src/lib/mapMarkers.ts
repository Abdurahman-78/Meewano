import L from "leaflet";

/**
 * Anchored "price pill" marker — Airbnb-style rounded pill with a tail
 * pointer that sits exactly on the lat/lng anchor.
 *
 * Anchoring strategy (must stay in sync with the CSS in src/index.css):
 *   - The Leaflet divIcon wrapper (.price-pill-wrap) is sized 0×0 and
 *     positioned at the lat/lng.
 *   - The inner .price-pill is absolutely positioned and translated so its
 *     tail tip aligns with that anchor point.
 *   - Hover/active states scale the inner pill from 50% 100% so the tail
 *     tip never moves.
 *
 * All visual styling (colors, hover, :active, reduced motion, expanded
 * hit area) lives in src/index.css under "Price pill marker" — keep
 * markup and CSS in lockstep when changing either side.
 */
export interface PricePillOptions {
  /** Already-formatted price string (e.g. "$120" or "150,000 IQD"). */
  price: string;
  /** Optional property name revealed when the marker is active/hovered. */
  title?: string;
  /** Optional supporting text revealed when active (for example "per night"). */
  subtitle?: string;
  /** Whether the pill is in its active/hovered state. */
  isActive?: boolean;
  /** Optional aria-label for accessibility. */
  ariaLabel?: string;
}

export const createPricePillIcon = ({
  price,
  title,
  subtitle,
  isActive = false,
  ariaLabel,
}: PricePillOptions): L.DivIcon => {
  const labelAttr = ariaLabel
    ? ` role="button" aria-label="${escapeAttr(ariaLabel)}"`
    : "";
  const detailsMarkup = title
    ? `
        <span class="price-pill__details" aria-hidden="true">
          <span class="price-pill__name">${escapeHtml(title)}</span>
          <span class="price-pill__price">${escapeHtml(price)}${subtitle ? ` <span class="price-pill__night">${escapeHtml(subtitle)}</span>` : ""}</span>
        </span>`
    : "";

  return L.divIcon({
    className: `price-pill-wrap${isActive ? " is-hovered" : ""}`,
    html: `
      <div class="price-pill"${labelAttr}>
        <span class="price-pill__text">${escapeHtml(price)}</span>
        ${detailsMarkup}
        <span class="price-pill__tail"></span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Minimal HTML/attribute escaping — price strings are app-controlled today,
// but keep this safe in case the formatter ever returns user-influenced data.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input).replace(/"/g, "&quot;");
}
