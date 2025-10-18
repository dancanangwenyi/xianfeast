// Currency configuration for XianFeast
export const CURRENCIES = {
  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    locale: "en-KE",
    isDefault: true,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    locale: "en-US",
    isDefault: false,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    locale: "en-EU",
    isDefault: false,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    locale: "en-GB",
    isDefault: false,
  },
  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    locale: "en-CA",
    isDefault: false,
  },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    locale: "en-AU",
    isDefault: false,
  },
  SGD: {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    locale: "en-SG",
    isDefault: false,
  },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export const DEFAULT_CURRENCY: CurrencyCode = "KES"

export const DEFAULT_TIMEZONE = "Africa/Nairobi"

export function formatPrice(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const currencyConfig = CURRENCIES[currency]
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.code,
  }).format(cents / 100)
}

export function formatPriceLocal(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return formatPrice(cents, currency)
}

export function getCurrencySymbol(currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency].symbol
}

export function getCurrencyName(currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency].name
}

export function getCurrencyOptions() {
  return Object.entries(CURRENCIES).map(([code, config]) => ({
    value: code,
    label: `${code} - ${config.name}`,
  }))
}

export function getDefaultCurrencyConfig() {
  return CURRENCIES[DEFAULT_CURRENCY]
}
