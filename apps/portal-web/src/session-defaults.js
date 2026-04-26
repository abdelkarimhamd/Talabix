import { actorAbilities } from '@talabix/shared/contracts/abilities';

export const defaultOpsSession = {
  actor: 'ops',
  label: 'Ops dispatcher',
  scopeSummary:
    'Dispatch, support, and settlement visibility through scoped ops abilities.',
  permissions: actorAbilities.ops,
  token: 'ops-demo-token',
  isDemo: true,
};

export const defaultMerchantSession = {
  actor: 'merchant',
  label: 'Merchant manager',
  scopeSummary:
    'Order board and catalog access constrained to merchant membership scope.',
  permissions: actorAbilities.merchant,
  token: 'merchant-demo-token',
  isDemo: true,
};

export const portalSessionActorStorageKey = 'talabix.portal.actor';
export const portalAuthStorageKey = 'talabix.portal.auth.v1';

export const portalDemoSessions = {
  merchant: defaultMerchantSession,
  ops: defaultOpsSession,
};

export function getPortalDemoSession(actor) {
  return portalDemoSessions[actor] ?? defaultOpsSession;
}

export function buildAuthenticatedOpsSession(authSession) {
  const abilities =
    authSession.user?.abilities?.length > 0
      ? authSession.user.abilities
      : actorAbilities.ops;
  const email = authSession.user?.email ?? '';

  return {
    actor: 'ops',
    label: authSession.user?.name ?? 'Ops admin',
    scopeSummary: email
      ? `Signed in as ${email}.`
      : 'Signed in with scoped ops permissions.',
    permissions: abilities,
    token: authSession.token,
    user: authSession.user,
    isAuthenticated: true,
  };
}

export function readStoredOpsSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(portalAuthStorageKey);

    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession);

    if (!parsedSession?.token || !parsedSession?.user?.email) {
      window.localStorage.removeItem(portalAuthStorageKey);
      return null;
    }

    return buildAuthenticatedOpsSession(parsedSession);
  } catch {
    window.localStorage.removeItem(portalAuthStorageKey);
    return null;
  }
}

export function storeOpsSession(authSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    portalAuthStorageKey,
    JSON.stringify(authSession)
  );
  window.localStorage.setItem(portalSessionActorStorageKey, 'ops');
}

export function clearStoredOpsSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(portalAuthStorageKey);
}
