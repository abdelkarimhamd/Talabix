import { createContext, useContext, useMemo, useState } from 'react';
import {
  createTranslator,
  fallbackLocale,
  formatCurrency as formatSharedCurrency,
  getDirection,
  labelForEnum as getSharedEnumLabel,
  logicalFlexDirection,
  logicalTextAlign,
  normalizeLocale,
  tp as translatePlural,
} from '@talabix/shared/i18n';

const I18nContext = createContext(null);

export function I18nProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(initialLocale ?? fallbackLocale));
  const dir = getDirection(locale);

  const value = useMemo(() => {
    const translator = createTranslator(locale);

    return {
      dir,
      isRtl: dir === 'rtl',
      locale,
      setLocale: (nextLocale) => setLocaleState(normalizeLocale(nextLocale)),
      t: translator.t,
      tp: (key, count, params = {}) => translatePlural(key, count, params, locale),
      labelForEnum: (group, value) => getSharedEnumLabel(group, value, locale),
      formatCurrency: (amountMinor, currency = 'SAR', options = {}) =>
        formatSharedCurrency(amountMinor, currency, locale, options),
      textAlign: logicalTextAlign(locale),
      rowDirection: logicalFlexDirection(locale),
      writingDirection: dir,
    };
  }, [dir, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}
