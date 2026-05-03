import React, { createContext, useContext } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type Currency = "IQD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_EXCHANGE_RATE = 1300;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: siteSettings } = useSiteSettings();

  // Read exchange rate from site settings (used to convert legacy USD-stored prices to IQD display)
  const exchangeRate: number = (() => {
    if (!siteSettings) return DEFAULT_EXCHANGE_RATE;
    const raw = typeof siteSettings === "object" && !Array.isArray(siteSettings)
      ? (siteSettings as Record<string, any>)["usd_to_iqd_rate"]
      : undefined;
    const parsed = Number(raw);
    return parsed > 0 ? parsed : DEFAULT_EXCHANGE_RATE;
  })();

  // Always IQD now — currency switching has been removed.
  const currency: Currency = "IQD";
  const setCurrency = (_curr: Currency) => {
    // no-op: only IQD is supported
  };

  // If a price is small (< 10000) we treat it as a legacy USD value and convert.
  // Prices already stored as IQD (>= 10000) are returned as-is.
  const convertPrice = (price: number): number => {
    if (!price && price !== 0) return 0;
    if (price < 10000) {
      return Math.round(price * exchangeRate);
    }
    return Math.round(price);
  };

  const formatPrice = (price: number): string => {
    const v = convertPrice(price);
    return `${v.toLocaleString()} IQD`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
