/**
 * Who runs NOTtEodo.
 * Dynamic values are stored in and edited from the Supabase `platform_config` table (under key "identity").
 * The values below serve as initial fallbacks.
 */
export const IDENTITY = {
  developer: "Allen Francis",
  supportEmail: "allenfrancis2005@gmail.com",
  privacyEmail: "allenfrancis2005@gmail.com",
  grievanceOfficer: "Allen Francis",
  grievanceEmail: "allenfrancis2005@gmail.com",
  address: "Kerala, India",
  country: "India",
  domain: "notteodo.com",
  securityContact: "allenfrancis2005@gmail.com",
} as const;
