/** When false (default), STR/Apify data loads only when the user clicks Load STR Data. */
export function isStrAutoFetchEnabled(): boolean {
  return process.env.NEXT_PUBLIC_APIFY_STR_AUTO_FETCH === "true";
}
