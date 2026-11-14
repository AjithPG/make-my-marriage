import { getRequestConfig } from "next-intl/server";

// MVP is English only (PRD §6). Malayalam arrives in v1.1 as messages/ml.json.
const locale = "en";

export default getRequestConfig(async () => ({
  locale,
  timeZone: "Asia/Kolkata",
  messages: (await import(`../../messages/${locale}.json`)).default,
}));
