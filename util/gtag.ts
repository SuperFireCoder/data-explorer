import { getGoogleAnalyticsTrackingId } from "./env";

export const GA_TRACKING_ID = getGoogleAnalyticsTrackingId();

export const pageview = (url: URL) => {
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url
  });
};
