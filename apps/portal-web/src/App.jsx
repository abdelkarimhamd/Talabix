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
  useLocation,
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
import { OpsUserManagementBoard } from './features/ops/OpsUserManagementBoard.jsx';
import { PasswordChangeBoard } from './features/ops/PasswordChangeBoard.jsx';
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
    groupKey: 'navigation.groups.work',
    iconName: 'orders',
  },
  {
    labelKey: 'navigation.merchantCatalog',
    path: '/merchant/catalog',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.scoped',
    requiredPermissions: ['merchant:catalog.read'],
    groupKey: 'navigation.groups.manage',
    iconName: 'catalog',
  },
  {
    labelKey: 'navigation.merchantPromotions',
    path: '/merchant/promotions',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.offers',
    groupKey: 'navigation.groups.manage',
    iconName: 'offers',
  },
  {
    labelKey: 'navigation.merchantReports',
    path: '/merchant/reports',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.sales',
    requiredPermissions: ['merchant:dashboard.read'],
    groupKey: 'navigation.groups.finance',
    iconName: 'reports',
  },
  {
    labelKey: 'navigation.merchantInbox',
    path: '/merchant/notifications',
    actors: ['merchant'],
    badgeKey: 'navigation.badges.inbox',
    requiredPermissions: ['merchant:notifications.read'],
    groupKey: 'navigation.groups.work',
    iconName: 'support',
  },
  {
    labelKey: 'navigation.opsDashboard',
    path: '/ops/dashboard',
    actors: ['ops'],
    badgeKey: 'navigation.badges.kpi',
    requiredPermissions: ['ops:dashboard.read'],
    groupKey: 'navigation.groups.work',
    iconName: 'dashboard',
  },
  {
    labelKey: 'navigation.opsUsers',
    path: '/ops/users',
    actors: ['ops'],
    badgeKey: 'navigation.badges.users',
    requiredPermissions: ['ops:users.manage'],
    groupKey: 'navigation.groups.account',
    iconName: 'users',
  },
  {
    labelKey: 'navigation.dispatchBoard',
    path: '/ops/dispatch',
    actors: ['ops'],
    badgeKey: 'navigation.badges.ops',
    requiredPermissions: ['ops:dispatch.manage'],
    groupKey: 'navigation.groups.work',
    iconName: 'dispatch',
  },
  {
    labelKey: 'navigation.opsConfiguration',
    path: '/ops/configuration',
    actors: ['ops'],
    badgeKey: 'navigation.badges.config',
    requiredPermissions: ['ops:merchants.manage'],
    groupKey: 'navigation.groups.manage',
    iconName: 'settings',
  },
  {
    labelKey: 'navigation.opsPromotions',
    path: '/ops/promotions',
    actors: ['ops'],
    badgeKey: 'navigation.badges.offers',
    requiredPermissions: ['ops:merchants.manage'],
    groupKey: 'navigation.groups.manage',
    iconName: 'offers',
  },
  {
    labelKey: 'navigation.settlementLedger',
    path: '/ops/settlements',
    actors: ['ops'],
    badgeKey: 'navigation.badges.finance',
    requiredPermissions: ['ops:settlements.read'],
    groupKey: 'navigation.groups.finance',
    iconName: 'finance',
  },
  {
    labelKey: 'navigation.supportConsole',
    path: '/ops/support',
    actors: ['ops'],
    badgeKey: 'navigation.badges.audit',
    requiredPermissions: ['ops:support.manage'],
    groupKey: 'navigation.groups.work',
    iconName: 'support',
  },
  {
    labelKey: 'navigation.accountSecurity',
    path: '/ops/account',
    actors: ['ops'],
    badgeKey: 'navigation.badges.security',
    groupKey: 'navigation.groups.account',
    iconName: 'security',
  },
];

const navGroupOrder = [
  'navigation.groups.work',
  'navigation.groups.manage',
  'navigation.groups.finance',
  'navigation.groups.account',
];

const navIconPaths = {
  catalog:
    'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Zm4 2v3h8v-3H8Zm0 6v3h8v-3H8Z',
  dashboard:
    'M4 5.5A1.5 1.5 0 0 1 5.5 4h5v7h-6.5V5.5Zm9.5-1.5h5A1.5 1.5 0 0 1 20 5.5v3h-6.5V4ZM4 13.5h6.5V20h-5A1.5 1.5 0 0 1 4 18.5v-5Zm9.5-2.5H20v7.5a1.5 1.5 0 0 1-1.5 1.5h-5v-9Z',
  dispatch:
    'M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Zm0 2.3 4.7 2.6L12 10.5 7.3 7.9 12 5.3Zm-5.5 4.3 4.5 2.5v5.8l-4.5-2.5V9.6Zm6.5 8.3v-5.8l4.5-2.5v5.8L13 17.9Z',
  finance:
    'M5 18.5h14V20H5v-1.5Zm1.5-2.5H9V9H6.5v7Zm4.25 0h2.5V5h-2.5v11ZM15 16h2.5v-4.5H15V16Z',
  offers:
    'M5 6.5A1.5 1.5 0 0 1 6.5 5h4.1l8.4 8.4a1.5 1.5 0 0 1 0 2.1L15.5 19a1.5 1.5 0 0 1-2.1 0L5 10.6V6.5Zm3 2.25A1.25 1.25 0 1 0 8 6.25a1.25 1.25 0 0 0 0 2.5Z',
  orders: 'M6 4h12v16H6V4Zm2 3v1.5h8V7H8Zm0 4v1.5h8V11H8Zm0 4v1.5h5V15H8Z',
  reports:
    'M5 19V5h14v14H5Zm3-3h2.2v-5H8v5Zm3.9 0h2.2V8h-2.2v8Zm3.9 0H18v-3h-2.2v3Z',
  security:
    'M12 3.5 18 6v5.2c0 3.8-2.4 7.3-6 8.8-3.6-1.5-6-5-6-8.8V6l6-2.5Zm0 2.2L8 7.35v3.85c0 2.65 1.55 5.1 4 6.35 2.45-1.25 4-3.7 4-6.35V7.35l-4-1.65Z',
  settings:
    'M12 8.2A3.8 3.8 0 1 1 12 15.8 3.8 3.8 0 0 1 12 8.2Zm0-5.2 1.2 2.2 2.5.4.4 2.5 2.2 1.2-1.2 2.2.8 2.4-2 1.6-.4 2.5-2.5.4L12 21l-1.2-2.2-2.5-.4-.4-2.5-2-1.6.8-2.4L5.5 9.3l2.2-1.2.4-2.5 2.5-.4L12 3Z',
  support:
    'M12 4a7 7 0 0 0-7 7v3.5A2.5 2.5 0 0 0 7.5 17H9v-6H7v-.1a5 5 0 0 1 10 0v.1h-2v6h1.2A4.2 4.2 0 0 1 12 20h-1v-2h1a2.2 2.2 0 0 0 2.2-2.2V11A7 7 0 0 0 12 4Z',
  users:
    'M8.8 11.2a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Zm0 2c2.7 0 5 1.2 5.8 3.1.4 1-.3 2.2-1.4 2.2H4.4c-1.1 0-1.8-1.1-1.4-2.2.8-1.9 3.1-3.1 5.8-3.1Zm7.1-1.7a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Zm.4 1.7c2 0 3.8.9 4.4 2.4.4 1-.3 1.9-1.3 1.9h-3.2c-.1-.7-.3-1.4-.7-2.1-.4-.8-1-1.5-1.8-2 .8-.2 1.7-.2 2.6-.2Z',
};

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
                  path="/ops/account"
                  element={
                    <RequireAccess allowedActors={['ops']}>
                      <PasswordChangeBoard />
                    </RequireAccess>
                  }
                />
                <Route
                  path="/ops/users"
                  element={
                    <RequireAccess
                      allowedActors={['ops']}
                      requiredPermissions={['ops:users.manage']}
                    >
                      <OpsUserManagementBoard />
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
  const location = useLocation();
  const navigate = useNavigate();
  const activeAbilities =
    session.permissions ?? actorAbilities[session.actor] ?? [];
  const visibleNav = navItems.filter(
    (item) =>
      item.actors.includes(session.actor) &&
      (item.requiredPermissions ?? []).every((permission) =>
        activeAbilities.includes(permission)
      )
  );
  const currentNav =
    visibleNav.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
    ) ?? visibleNav[0];
  const groupedNav = navGroupOrder
    .map((groupKey) => ({
      groupKey,
      items: visibleNav.filter((item) => item.groupKey === groupKey),
    }))
    .filter((group) => group.items.length > 0);
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
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">{t('portal.brandMark')}</span>
          <div>
            <strong>{t('portal.title')}</strong>
            <span>{t('portal.deliveryControl')}</span>
          </div>
        </div>

        <div className="topbar-actions">
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

          {session.isAuthenticated ? (
            <button
              className="action-button secondary topbar-signout"
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
        </div>
      </header>

      <div className="portal-grid">
        <aside className="sidebar">
          <nav className="nav-list" aria-label={t('navigation.primary')}>
            {groupedNav.map((group) => (
              <section className="nav-section" key={group.groupKey}>
                <span className="nav-section-label">{t(group.groupKey)}</span>
                <div className="nav-section-links">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      className={({ isActive }) =>
                        `nav-link${isActive ? ' active' : ''}`
                      }
                      to={item.path}
                    >
                      <NavIcon name={item.iconName} />
                      <span className="nav-link-copy">
                        <span>{t(item.labelKey)}</span>
                        <small aria-hidden="true">{t(item.badgeKey)}</small>
                      </span>
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <main className="content" id="portal-main" tabIndex="-1">
          <section className="workspace-header">
            <div>
              <span className="eyebrow">{t('portal.activeSession')}</span>
              <h2>{currentNav ? t(currentNav.labelKey) : t('portal.title')}</h2>
              <p>{session.scopeSummary}</p>
            </div>
            <div className="workspace-session">
              <span>{t('portal.currentWorkspace')}</span>
              <strong>{session.label}</strong>
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

function NavIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      className="nav-icon"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d={navIconPaths[name] ?? navIconPaths.dashboard} />
    </svg>
  );
}
