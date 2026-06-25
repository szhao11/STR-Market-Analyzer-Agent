export const RECENT_MARKETS_CHANGED = "recent-markets-changed";

export function notifyRecentMarketsChanged(): void {
  window.dispatchEvent(new CustomEvent(RECENT_MARKETS_CHANGED));
}
