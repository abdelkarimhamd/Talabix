import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyLaunchEvidenceRows,
  evaluateLaunchWorkbench,
  externalAccessChecklistFor,
  formatWorkbenchReport,
  redactWorkbenchOutput,
} from './launch-workbench.mjs';

const allRunbooksPresent = new Map([
  ['docs/ops/dispatch-sla-alert-drill.md', true],
  ['docs/ops/maps-provider-alert-drill.md', true],
  ['docs/ops/mysql-backup-restore-drill.md', true],
]);

test('classifies ready pending and blocked launch evidence rows', () => {
  const rows = [
    {
      area: 'Staging deployment',
      evidence: 'Successful staging deploy, migrations, and smoke checks',
      status: 'Pass',
      owner: 'Ops',
      note: 'release-123',
    },
    {
      area: 'Baseline monitoring',
      evidence: 'Uptime and queue monitors',
      status: 'Pending',
      owner: '',
      note: '',
    },
    {
      area: 'Maps provider alerts',
      evidence: 'Provider alerts and fallback drill',
      status: 'Blocked',
      owner: '',
      note: 'Blocked: staging key, provider dashboard links, and log-drain monitor links are not available',
    },
  ];

  assert.deepEqual(classifyLaunchEvidenceRows(rows), [
    {
      area: 'Staging deployment',
      evidence: 'Successful staging deploy, migrations, and smoke checks',
      status: 'Ready',
      rawStatus: 'Pass',
      owner: 'Ops',
      note: 'release-123',
      category: 'ready',
      nextAction: 'Keep evidence current before promotion.',
    },
    {
      area: 'Baseline monitoring',
      evidence: 'Uptime and queue monitors',
      status: 'Pending',
      rawStatus: 'Pending',
      owner: '',
      note: '',
      category: 'local-evidence',
      nextAction:
        'Record the missing local evidence or mark the row Blocked with a concrete dependency.',
    },
    {
      area: 'Maps provider alerts',
      evidence: 'Provider alerts and fallback drill',
      status: 'Blocked',
      rawStatus: 'Blocked',
      owner: '',
      note: 'Blocked: staging key, provider dashboard links, and log-drain monitor links are not available',
      category: 'external-access',
      nextAction:
        'Resolve external blocker: staging key, provider dashboard links, and log-drain monitor links are not available.',
    },
  ]);
});

test('evaluates a launch workbench report without requiring live credentials', () => {
  const result = evaluateLaunchWorkbench({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pending | | |
| Maps provider alerts | Provider drill completed | Blocked | | Blocked: staging key and log-drain monitor links are missing |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '',
    runbookStatus: allRunbooksPresent,
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.areas.length, 2);
  assert.equal(result.areas[0].category, 'local-evidence');
  assert.equal(result.areas[1].category, 'external-access');
  assert.deepEqual(result.externalAccessChecklist, [
    {
      area: 'Maps provider alerts',
      owner: 'Unassigned',
      request: 'staging key and log-drain monitor links',
    },
  ]);
  assert.deepEqual(result.warnings, [
    'Set TALABIX_PREFLIGHT_PHP_VERSION=8.3.x when running launch:preflight.',
  ]);
});

test('reports missing evidence and missing runbooks as local blockers', () => {
  const result = evaluateLaunchWorkbench({
    launchEvidence: '',
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '8.3.30',
    runbookStatus: new Map([
      ['docs/ops/dispatch-sla-alert-drill.md', false],
      ['docs/ops/maps-provider-alert-drill.md', true],
      ['docs/ops/mysql-backup-restore-drill.md', true],
    ]),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.areas[0].area, 'Launch evidence record');
  assert.equal(result.areas[0].category, 'local-evidence');
  assert.deepEqual(result.runbooks[0], {
    path: 'docs/ops/dispatch-sla-alert-drill.md',
    status: 'missing',
    category: 'local-evidence',
  });
});

test('redacts API keys and credential-bearing DSNs from formatted output', () => {
  const unsafe =
    'GOOGLE_MAPS_API_KEY=AIza1234567890abcdefghijklmnopqrstuvwxyz https://abc:def@example.sentry.io/123';

  assert.equal(
    redactWorkbenchOutput(unsafe),
    'GOOGLE_MAPS_API_KEY=[redacted-google-api-key] [redacted-dsn]'
  );
});

test('builds an external access checklist from blocked evidence notes', () => {
  const checklist = externalAccessChecklistFor([
    {
      area: 'Staging deployment',
      owner: 'Ops',
      evidence: 'Successful staging deploy',
      category: 'external-access',
      note: 'Blocked: staging VM/domain/secrets and deployment target access are not available',
    },
    {
      area: 'Local runbook',
      owner: '',
      evidence: 'Documented runbook',
      category: 'local-evidence',
      note: '',
    },
  ]);

  assert.deepEqual(checklist, [
    {
      area: 'Staging deployment',
      owner: 'Ops',
      request: 'staging VM/domain/secrets and deployment target access',
    },
  ]);
});

test('formats an operator-friendly workbench report', () => {
  const report = formatWorkbenchReport({
    status: 'blocked',
    areas: [
      {
        area: 'Maps provider alerts',
        status: 'Blocked',
        category: 'external-access',
        nextAction: 'Add staging key and monitor links.',
      },
    ],
    runbooks: [
      {
        path: 'docs/ops/maps-provider-alert-drill.md',
        status: 'present',
        category: 'ready',
      },
    ],
    warnings: [
      'Set TALABIX_PREFLIGHT_PHP_VERSION=8.3.x when running launch:preflight.',
    ],
    externalAccessChecklist: [
      {
        area: 'Maps provider alerts',
        owner: 'Ops',
        request: 'staging key and monitor links',
      },
    ],
    nextActions: ['Keep external blockers marked Blocked until access exists.'],
  });

  assert.match(report, /^Talabix launch workbench: blocked/);
  assert.match(
    report,
    /Maps provider alerts: Blocked \(external-access\) - Add staging key and monitor links\./
  );
  assert.match(report, /docs\/ops\/maps-provider-alert-drill\.md: present/);
  assert.match(
    report,
    /Maps provider alerts \(Ops\): provide staging key and monitor links\./
  );
  assert.match(report, /Suggested next local actions:/);
});

test('suggests launch preflight commands for PowerShell and POSIX shells', () => {
  const result = evaluateLaunchWorkbench({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Blocked | Ops | Blocked: staging VM access is missing |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '',
    runbookStatus: allRunbooksPresent,
  });

  assert.equal(
    result.areas[0].nextAction,
    'Resolve external blocker: staging VM access is missing.'
  );
  assert.ok(
    result.nextActions.includes('Share the external access checklist with Ops.')
  );
  assert.ok(
    result.nextActions.includes(
      "PowerShell: $env:TALABIX_PREFLIGHT_PHP_VERSION='8.3.30'; npm.cmd run launch:preflight"
    )
  );
  assert.ok(
    result.nextActions.includes(
      'POSIX shells: TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight'
    )
  );
});
