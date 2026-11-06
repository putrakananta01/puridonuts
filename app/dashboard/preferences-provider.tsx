"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  getCurrencyLocale,
  type AccountPreferences,
} from "@/lib/account-preferences";

type PreferencesContextValue = AccountPreferences & {
  formatCurrency: (value: number) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export default function PreferencesProvider({
  children,
  preferences,
}: {
  children: ReactNode;
  preferences: AccountPreferences;
}) {
  const { currency, language } = preferences;
  const value = useMemo(() => {
    const formatter = new Intl.NumberFormat(
      getCurrencyLocale(currency),
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    );

    return {
      currency,
      language,
      formatCurrency: (amount: number) => formatter.format(amount),
    };
  }, [currency, language]);

  useEffect(() => {
    document.documentElement.lang = preferences.language;
  }, [preferences.language]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useAccountPreferences(): PreferencesContextValue {
  const preferences = useContext(PreferencesContext);

  if (!preferences) {
    throw new Error(
      "Preferensi akun harus digunakan di dalam PreferencesProvider."
    );
  }

  return preferences;
}
