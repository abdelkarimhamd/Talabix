import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { I18nProvider } from '../i18n';

function resolveInitialLocale(initialLocale) {
  if (initialLocale) {
    return initialLocale;
  }

  if (typeof globalThis?.location?.search !== 'string') {
    return undefined;
  }

  if (typeof URLSearchParams !== 'function') {
    return undefined;
  }

  const params = new URLSearchParams(globalThis.location.search);

  return params.get('locale') ?? params.get('lang') ?? undefined;
}

export function AppProviders({ children, initialLocale }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 0,
            retry: false,
            staleTime: 30000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <I18nProvider initialLocale={resolveInitialLocale(initialLocale)}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </I18nProvider>
  );
}
