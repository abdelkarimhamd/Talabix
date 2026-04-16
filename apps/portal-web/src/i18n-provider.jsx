import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  createTranslator,
  fallbackLocale,
  formatCurrency as formatSharedCurrency,
  formatDate as formatSharedDate,
  formatDateTime as formatSharedDateTime,
  formatNumber as formatSharedNumber,
  getDirection,
  labelForEnum,
  normalizeLocale,
  tp as translatePlural,
} from '@talabix/shared/i18n';
import { I18nContext, portalLocaleStorageKey } from './i18n-store.js';

export function I18nProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState(() => {
    if (initialLocale) {
      return normalizeLocale(initialLocale);
    }

    if (typeof window !== 'undefined') {
      return normalizeLocale(window.localStorage.getItem(portalLocaleStorageKey));
    }

    return fallbackLocale;
  });

  const dir = getDirection(locale);

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.body.dataset.locale = locale;
    document.body.dataset.dir = dir;
  }, [dir, locale]);

  const value = useMemo(() => {
    const translator = createTranslator(locale);

    function setLocale(nextLocale) {
      const normalized = normalizeLocale(nextLocale);

      setLocaleState(normalized);
      window.localStorage.setItem(portalLocaleStorageKey, normalized);
    }

    return {
      dir,
      isRtl: dir === 'rtl',
      locale,
      setLocale,
      t: translator.t,
      tp: (key, count, params = {}) => translatePlural(key, count, params, locale),
      labelForEnum: (group, value) => labelForEnum(group, value, locale),
      formatCurrency: (amountMinor, currency = 'SAR', options = {}) =>
        formatSharedCurrency(amountMinor, currency, locale, options),
      formatDate: (value, options = {}) => formatSharedDate(value, locale, options),
      formatDateTime: (value, options = {}) => formatSharedDateTime(value, locale, options),
      formatNumber: (value, options = {}) => formatSharedNumber(value, locale, options),
    };
  }, [dir, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
