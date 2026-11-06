export const SUPPORTED_LANGUAGES = ["id", "en"] as const;
export const SUPPORTED_CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type AppCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type AccountPreferences = {
  language: AppLanguage;
  currency: AppCurrency;
};

export function isAppLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === value);
}

export function isAppCurrency(value: string): value is AppCurrency {
  return SUPPORTED_CURRENCIES.some((currency) => currency === value);
}

const DEFAULT_PREFERENCES: AccountPreferences = {
  language: "id",
  currency: "IDR",
};

export function readAccountPreferences(metadata: unknown): AccountPreferences {
  if (!metadata || typeof metadata !== "object") return DEFAULT_PREFERENCES;

  const preferences = (metadata as Record<string, unknown>).preferences;
  if (!preferences || typeof preferences !== "object") return DEFAULT_PREFERENCES;

  const values = preferences as Record<string, unknown>;

  return {
    language: typeof values.language === "string" && isAppLanguage(values.language)
      ? values.language
      : DEFAULT_PREFERENCES.language,
    currency: typeof values.currency === "string" && isAppCurrency(values.currency)
      ? values.currency
      : DEFAULT_PREFERENCES.currency,
  };
}

export function getCurrencyLocale(currency: AppCurrency): string {
  switch (currency) {
    case "USD":
      return "en-US";
    case "SGD":
      return "en-SG";
    case "MYR":
      return "ms-MY";
    case "EUR":
      return "de-DE";
    case "IDR":
      return "id-ID";
  }
}
