import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BrowserRouter,
  MemoryRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { actorAbilities } from '@talabix/shared/contracts/abilities';
import { MerchantCatalogManager } from './features/merchant/MerchantCatalogManager.jsx';
import { MerchantNotificationsBoard } from './features/merchant/MerchantNotificationsBoard.jsx';
import { MerchantOrderBoard } from './features/merchant/MerchantOrderBoard.jsx';
import { MerchantSalesReportBoard } from './features/merchant/MerchantSalesReportBoard.jsx';
import { DispatchBoard } from './features/ops/DispatchBoard.jsx';
import { OpsDashboardBoard } from './features/ops/OpsDashboardBoard.jsx';
import { OpsConfigurationBoard } from './features/ops/OpsConfigurationBoard.jsx';
import { SettlementBoard } from './features/ops/SettlementBoard.jsx';
import { SupportConsole } from './features/ops/SupportConsole.jsx';
import { createPortalApi } from './portal-api.js';
import { defaultOpsSession } from './session-defaults.js';
import { SessionProvider } from './session-context.jsx';
import { useSession } from './use-session.js';

const navItems = [
  {
    label: 'Merchant Orders',
    path: '/merchant/orders',
    actors: ['merchant'],
    badge: 'Live',
  },
  {
    label: 'Merchant Catalog',
    path: '/merchant/catalog',
    actors: ['merchant'],
    badge: 'Scoped',
  },
  {
    label: 'Merchant Reports',
    path: '/merchant/reports',
    actors: ['merchant'],
    badge: 'Sales',
  },
  {
    label: 'Merchant Inbox',
    path: '/merchant/notifications',
    actors: ['merchant'],
    badge: 'Inbox',
  },
  {
    label: 'Ops Dashboard',
    path: '/ops/dashboard',
    actors: ['ops'],
    badge: 'KPI',
  },
  {
    label: 'Ops Configuration',
    path: '/ops/configuration',
    actors: ['ops'],
    badge: 'Config',
  },
  {
    label: 'Dispatch Board',
    path: '/ops/dispatch',
    actors: ['ops'],
    badge: 'Ops',
  },
  {
    label: 'Support Console',
    path: '/ops/support',
    actors: ['ops'],
    badge: 'Audit',
  },
  {
    label: 'Settlement Ledger',
    path: '/ops/settlements',
    actors: ['ops'],
    badge: 'Finance',
  },
];

export function App({
  initialSession = defaultOpsSession,
  initialEntries,
}) {
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

  const RouterComponent = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <SessionProvider session={initialSession} api={createPortalApi(initialSession)}>
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
  );
}

function PortalLayout() {
  const { session } = useSession();
  const visibleNav = navItems.filter((item) => item.actors.includes(session.actor));
  const activeAbilities = actorAbilities[session.actor] ?? [];

  return (
    <div className="portal-shell">
      <div className="portal-grid">
        <aside className="sidebar panel">
          <div className="sidebar-copy">
            <span className="brand-mark">T</span>
            <span className="eyebrow">Delivery control</span>
            <h1>Talabix portal</h1>
            <p>
              One React shell, split by actor routes and permissions so merchant staff
              and ops teams share infrastructure without sharing scope.
            </p>
          </div>

          <nav className="nav-list" aria-label="Primary">
            {visibleNav.map((item) => (
              <NavLink
                key={item.path}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                to={item.path}
              >
                <span>{item.label}</span>
                <span className="nav-pill">{item.badge}</span>
              </NavLink>
            ))}
          </nav>

          <div className="session-card">
            <span className="eyebrow">Active session</span>
            <strong>{session.label}</strong>
            <p>{session.scopeSummary}</p>
            <div className="session-tags">
              {activeAbilities.slice(0, 5).map((ability) => (
                <span key={ability}>{ability}</span>
              ))}
            </div>
          </div>
        </aside>

        <main className="content">
          <section className="hero panel">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">Route partitioning</span>
                <h2>Realtime boards without cross-actor leakage.</h2>
                <p>
                  The portal keeps merchant order operations and internal ops tools in one
                  codebase, while policy-aware route guards and scoped abilities decide who
                  can see or mutate each slice.
                </p>
              </div>
              <div className="hero-metrics">
                <div className="metric-card">
                  <span className="eyebrow">Namespaces</span>
                  <strong>4 actor APIs</strong>
                  <p>/customer, /merchant, /rider, and /ops share one Laravel backend.</p>
                </div>
                <div className="metric-card">
                  <span className="eyebrow">Contracts</span>
                  <strong>Shared validators</strong>
                  <p>Zod schemas, channel names, and ability constants come from one package.</p>
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

function RequireAccess({
  allowedActors,
  requiredPermissions = [],
  children,
}) {
  const { session } = useSession();
  const hasActorAccess = allowedActors.includes(session.actor);
  const hasPermissionAccess = requiredPermissions.every((permission) =>
    session.permissions.includes(permission)
  );

  if (!hasActorAccess || !hasPermissionAccess) {
    return (
      <section className="panel unauthorized">
        <span className="eyebrow">Access blocked</span>
        <h2>Not authorized for this route</h2>
        <p>
          The portal renders shared code, but route groups and ability scopes stay
          strict. Switch to a session that owns this path to continue.
        </p>
      </section>
    );
  }

  return children;
}
