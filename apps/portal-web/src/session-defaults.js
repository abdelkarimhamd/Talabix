import { actorAbilities } from '@talabix/shared/contracts/abilities';

export const defaultOpsSession = {
  actor: 'ops',
  label: 'Ops dispatcher',
  scopeSummary: 'Dispatch, support, and settlement visibility through scoped ops abilities.',
  permissions: actorAbilities.ops,
  token: 'ops-demo-token',
};

export const defaultMerchantSession = {
  actor: 'merchant',
  label: 'Merchant manager',
  scopeSummary: 'Order board and catalog access constrained to merchant membership scope.',
  permissions: actorAbilities.merchant,
  token: 'merchant-demo-token',
};
