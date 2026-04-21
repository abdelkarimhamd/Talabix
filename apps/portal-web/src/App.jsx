import React from 'react';
// i18n-audit: strict
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  BrowserRouter,
  MemoryRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { actorAbilities } from '@talabix/shared/contracts/abilities';
import { MerchantCatalogManager } from './features/merchant/MerchantCatalogManager.jsx';
import { MerchantNotificationsBoard } from './features/merchant/MerchantNotificationsBoard.jsx';
import { MerchantOrderBoard } from './features/merchant/MerchantOrderBoard.jsx';
import { MerchantSalesReportBoard } from './features/merchant/MerchantSalesReportBoard.jsx';
import { DispatchBoard } from './features/ops/DispatchBoard.jsx';
import { OpsDashboardBoard } from './features/ops/OpsDashboardBoard.jsx';
import { OpsConfigurationBoard } from './features/ops/OpsConfigurationBoard.jsx';
import { PromotionOffersBoard } from './features/ops/PromotionOffersBoard.jsx';
import { SettlementBoard } from './features/ops/SettlementBoard.jsx';
import { SupportConsole } from './features/ops/SupportConsole.jsx';
import { createPortalApi, loginOpsAdmin } from './portal-api.js';
import { I18nProvider } from './i18n-provider.jsx';
import { useI18n } from './use-i18n.js';
import {
  buildAuthenticatedOpsSession,
  clearStoredOpsSession,
  getPortalDemoSession,
  portalSessionActorStorageKey,
  readStoredOpsSession,
  storeOpsSession,
} from './session-defaults.js';
import { SessionProvider } from './session-context.jsx';
import { useSession } from './use-session.js';

const portalBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const navItems = [
  {
    labelKey: 'navigation.merchantOrders',
    path: '/merchant/orders',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.live',
  },
  {
    labelKey: 'navigation.merchantCatalog',
    path: '/merchant/catalog',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.scoped',
  },
  {
    labelKey: 'navigation.merchantPromotions',
    path: '/merchant/promotions',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.offers',
  },
  {
    labelKey: 'navigation.merchantReports',
    path: '/merchant/reports',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.sales',
  },
  {
    labelKey: 'navigation.merchantInbox',
    path: '/merchant/notifications',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.inbox',
  },
  {
    labelKey: 'navigation.opsDashboard',
    path: '/ops/dashboard',
    actors: ['ops'],
    badgeKey: 'navigation.badges.kpi',
  },
  {
    labelKey: 'navigation.dispatchBoard',
    path: '/ops/dispatch',
    actors: ['ops'],
    badgeKey: 'navigation.badges.ops',
  },
  {
    labelKey: 'navigation.opsConfiguration',
    path: '/ops/configuration',
    actors: ['ops'],
    badgeKey: 'navigation.badges.config',
  },
  {
    labelKey: 'navigation.opsPromotions',
    path: '/ops/promotions',
    actors: ['ops'],
    badgeKey: 'navigation.badges.offers',
  },
  {
    labelKey: 'navigation.settlementLedger',
    path: '/ops/settlements',
    actors: ['ops'],
    badgeKey: 'navigation.badges.finance',
  },
  {
    labelKey: 'navigation.supportConsole',
    path: '/ops/support',
    actors: ['ops'],
    badgeKey: 'navigation.badges.audit',
  },
];

export function App({
  initialSession,
  initialEntries,
  initialLocale,
  loginAdmin = loginOpsAdmin,
}) {
  const [activeSession, setActiveSession] = useState(() =>
    resolveInitialSession(initialSession)
  );
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const api = useMemo(
    () => (activeSession ? createPortalApi(activeSession) : null),
    [activeSession]
  );
  const handleLoginSuccess = useCallback(
    (authSession) => {
      const nextSession = buildAuthenticatedOpsSession(authSession);

      storeOpsSession(authSession);
      queryClient.clear();
      setActiveSession(nextSession);
    },
    [queryClient]
  );
  const logout = useCallback(async () => {
    try {
      if (activeSession?.isAuthenticated && api?.logout) {
        await api.logout();
      }
    } finally {
      clearStoredOpsSession();
      queryClient.clear();
      setActiveSession(null);
    }
  }, [activeSession, api, queryClient]);
  const switchActor = useCallback((actor) => {
    const nextSession = getPortalDemoSession(actor);

    setActiveSession(nextSession);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        portalSessionActorStorageKey,
        nextSession.actor
      );
    }
  }, []);

  if (!activeSession) {
    return (
      <I18nProvider initialLocale={initialLocale}>
        <AdminLoginScreen
          loginAdmin={loginAdmin}
          onLoginSuccess={handleLoginSuccess}
        />
      </I18nProvider>
    );
  }

  const RouterComponent = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries
    ? { initialEntries }
    : { basename: portalBasePath || undefined };

  return (
    <I18nProvider initialLocale={initialLocale}>
      <SessionProvider
        api={api}
        logout={logout}
        session={activeSession}
        switchActor={switchActor}
      >
        <QueryClientProvider client={queryClient}>
          <RouterComponent {...routerProps}>
            <Routes>
              <Route element={<PortalLayout />}>
                <Route index element={<HomeRedirect />} />
                <Route
                  path="/merchant/orders"
                  element={
                    <RequireAccess allowedActors={['merchant']}>
                      <MerchantOrderBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/merchant/catalog"
                  element={
                    <RequireAccess
                      allowedActors={['merchant']}
                      requiredPermissions={['merchant:catalog.read']}
                    >
                      <MerchantCatalogManager />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/merchant/notifications"
                  element={
                    <RequireAccess
                      allowedActors={['merchant']}
                      requiredPermissions={['merchant:notifications.read']}
                    >
                      <MerchantNotificationsBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/merchant/promotions"
                  element={
                    <RequireAccess
                      allowedActors={['merchant']}
                      requiredPermissions={['merchant:catalog.write']}
                    >
                      <PromotionOffersBoard scope="merchant" />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/merchant/reports"
                  element={
                    <RequireAccess
                      allowedActors={['merchant']}
                      requiredPermissions={['merchant:dashboard.read']}
                    >
                      <MerchantSalesReportBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/dashboard"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:dashboard.read']}
                    >
                      <OpsDashboardBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/configuration"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:merchants.manage']}
                    >
                      <OpsConfigurationBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/dispatch"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:dispatch.manage']}
                    >
                      <DispatchBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/promotions"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:merchants.manage']}
                    >
                      <PromotionOffersBoard scope="ops" />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/settlements"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:settlements.read']}
                    >
                      <SettlementBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/support"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:support.manage']}
                    >
                      <SupportConsole />
                    </RequireAccess>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RouterComponent>
        </QueryClientProvider>
      </SessionProvider>
    </I18nProvider>
  );
}

function AdminLoginScreen({ loginAdmin, onLoginSuccess }) {
  const { locale, setLocale, t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const authSession = await loginAdmin({
        email,
        password,
        device_name: 'portal-web',
      });

      onLoginSuccess(authSession);
    } catch (error) {
      setErrorMessage(readAuthErrorMessage(error) ?? t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section
        className="login-panel panel"
        aria-labelledby="admin-login-title"
      >
        <div className="login-brand">
          <span className="brand-mark">{t('portal.brandMark')}</span>
          <div>
            <span className="eyebrow">{t('auth.adminAccess')}</span>
            <h1 id="admin-login-title">{t('auth.loginTitle')}</h1>
          </div>
        </div>
        <p>{t('auth.loginBody')}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-stack">
            <span>{t('auth.emailLabel')}</span>
            <input
              autoComplete="email"
              autoFocus
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="field-stack">
            <span>{t('auth.passwordLabel')}</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="action-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div
          aria-label={t('common.language.switcherLabel')}
          className="language-switcher login-language"
          role="group"
        >
          <button
            aria-label={t('common.language.englishNative')}
            aria-pressed={locale === 'en'}
            className={locale === 'en' ? 'active' : ''}
            onClick={() => setLocale('en')}
            translate="no"
            type="button"
          >
            {t('common.language.englishNative')}
          </button>
          <button
            aria-label={`${t('common.language.arabicNative')} Arabic`}
            aria-pressed={locale === 'ar'}
            className={locale === 'ar' ? 'active' : ''}
            onClick={() => setLocale('ar')}
            translate="no"
            type="button"
          >
            {t('common.language.arabicNative')}
          </button>
        </div>
      </section>
    </main>
  );
}

function readAuthErrorMessage(error) {
  const responseMessage = error?.response?.data?.message;
  const emailMessages = error?.response?.data?.errors?.email;

  if (Array.isArray(emailMessages) && emailMessages.length > 0) {
    return emailMessages[0];
  }

  return typeof responseMessage === 'string' ? responseMessage : null;
}

function resolveInitialSession(initialSession) {
  if (initialSession) {
    return initialSession;
  }

  return readStoredOpsSession();
}

function PortalLayout() {
  const { logout, session, switchActor } = useSession();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const visibleNav = navItems.filter((item) =>
    item.actors.includes(session.actor)
  );
  const activeAbilities =
    session.permissions ?? actorAbilities[session.actor] ?? [];
  const handleActorSwitch = (actor) => {
    switchActor(actor);
    navigate(actor === 'merchant' ? '/merchant/orders' : '/ops/dashboard', {
      replace: true,
    });
  };

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#portal-main">
        {t('common.skipToMain')}
      </a>
      <div className="portal-grid">
        <aside className="sidebar panel">
          <div className="sidebar-copy">
            <span className="brand-mark">{t('portal.brandMark')}</span>
            <span className="eyebrow">{t('portal.deliveryControl')}</span>
            <h1>{t('portal.title')}</h1>
            <p>{t('portal.summary')}</p>
          </div>

          <nav className="nav-list" aria-label={t('navigation.primary')}>
            {visibleNav.map((item) => (
              <NavLink
                key={item.path}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
                to={item.path}
              >
                <span>{t(item.labelKey)}</span>
                <span aria-hidden="true" className="nav-pill">
                  {t(item.badgeKey)}
                </span>
              </NavLink>
            ))}
          </nav>

          <div
            aria-label={t('common.language.switcherLabel')}
            className="language-switcher"
            role="group"
          >
            <button
              aria-label={t('common.language.englishNative')}
              aria-pressed={locale === 'en'}
              className={locale === 'en' ? 'active' : ''}
              onClick={() => setLocale('en')}
              translate="no"
              type="button"
            >
              {t('common.language.englishNative')}
            </button>
            <button
              aria-label={`${t('common.language.arabicNative')} Arabic`}
              aria-pressed={locale === 'ar'}
              className={locale === 'ar' ? 'active' : ''}
              onClick={() => setLocale('ar')}
              translate="no"
              type="button"
            >
              {t('common.language.arabicNative')}
            </button>
          </div>

          <div className="session-card">
            <span className="eyebrow">{t('portal.activeSession')}</span>
            <strong>{session.label}</strong>
            <p>{session.scopeSummary}</p>
            <div className="session-tags">
              {activeAbilities.slice(0, 5).map((ability) => (
                <span key={ability} translate="no">
                  {ability}
                </span>
              ))}
            </div>
          </div>

          {session.isAuthenticated ? (
            <button
              className="action-button secondary sidebar-action"
              onClick={() => {
                void logout();
              }}
              type="button"
            >
              {t('auth.signOut')}
            </button>
          ) : (
            <div
              aria-label={t('portal.actorSwitcher')}
              className="actor-switcher"
              role="group"
            >
              <button
                aria-label={t('portal.switchToMerchantSession')}
                aria-pressed={session.actor === 'merchant'}
                className={session.actor === 'merchant' ? 'active' : ''}
                onClick={() => handleActorSwitch('merchant')}
                type="button"
              >
                {t('portal.merchantSession')}
              </button>
              <button
                aria-label={t('portal.switchToOpsSession')}
                aria-pressed={session.actor === 'ops'}
                className={session.actor === 'ops' ? 'active' : ''}
                onClick={() => handleActorSwitch('ops')}
                type="button"
              >
                {t('portal.opsSession')}
              </button>
            </div>
          )}
        </aside>

        <main className="content" id="portal-main" tabIndex="-1">
          <section className="hero panel">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">{t('portal.routePartitioning')}</span>
                <h2>{t('portal.heroTitle')}</h2>
                <p>{t('portal.heroBody')}</p>
              </div>
              <div className="hero-metrics">
                <div className="metric-card">
                  <span className="eyebrow">{t('portal.namespaces')}</span>
                  <strong>{t('portal.actorApis')}</strong>
                  <p>{t('portal.actorApisBody')}</p>
                </div>
                <div className="metric-card">
                  <span className="eyebrow">{t('portal.contracts')}</span>
                  <strong>{t('portal.sharedValidators')}</strong>
                  <p>{t('portal.sharedValidatorsBody')}</p>
                </div>
              </div>
            </div>
          </section>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { session } = useSession();

  if (session.actor === 'merchant') {
    return <Navigate to="/merchant/orders" replace />;
  }

  return <Navigate to="/ops/dashboard" replace />;
}

function RequireAccess({ allowedActors, requiredPermissions = [], children }) {
  const { session } = useSession();
  const { t } = useI18n();
  const hasActorAccess = allowedActors.includes(session.actor);
  const hasPermissionAccess = requiredPermissions.every((permission) =>
    session.permissions.includes(permission)
  );

  if (!hasActorAccess || !hasPermissionAccess) {
    return (
      <section className="panel unauthorized">
        <span className="eyebrow">{t('auth.accessBlocked')}</span>
        <h2>{t('auth.notAuthorized')}</h2>
        <p>{t('auth.routeScopeHelp')}</p>
      </section>
    );
  }

  return children;
}
