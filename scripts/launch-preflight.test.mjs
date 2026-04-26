import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLaunchPreflight,
  parseLaunchEvidenceRows,
  parseSemanticVersion,
} from './launch-preflight.mjs';

test('parses required launch evidence rows from the launch record table', () => {
  const rows = parseLaunchEvidenceRows(`
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pass | Ops | release-123 |
| Maps provider alerts | Provider drill completed | Pending | | |

## Other Section
`);

  assert.deepEqual(rows, [
    {
      area: 'Staging deployment',
      evidence: 'Smoke checks passed',
      status: 'Pass',
      owner: 'Ops',
      note: 'release-123',
    },
    {
      area: 'Maps provider alerts',
      evidence: 'Provider drill completed',
      status: 'Pending',
      owner: '',
      note: '',
    },
  ]);
});

test('blocks launch when required evidence is still pending', () => {
  const result = evaluateLaunchPreflight({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pass | Ops | release-123 |
| Dispatch SLA alerting | Log-drain drill completed | Pending | | |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '8.3.2',
    runbookStatus: new Map([
      ['docs/ops/dispatch-sla-alert-drill.md', true],
      ['docs/ops/maps-provider-alert-drill.md', true],
      ['docs/ops/mysql-backup-restore-drill.md', true],
    ]),
  });

  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.blockers, [
    'Dispatch SLA alerting evidence is Pending. Complete the evidence row in docs/ops/launch-evidence.md.',
  ]);
});

test('blocks launch when the supplied PHP runtime is below the API requirement', () => {
  const result = evaluateLaunchPreflight({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pass | Ops | release-123 |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '8.2.12',
    runbookStatus: new Map([
      ['docs/ops/dispatch-sla-alert-drill.md', true],
      ['docs/ops/maps-provider-alert-drill.md', true],
      ['docs/ops/mysql-backup-restore-drill.md', true],
    ]),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(
    result.blockers.at(-1),
    'PHP runtime 8.2.12 is below the API requirement ^8.3.'
  );
});

test('blocks launch when the PHP runtime is not supplied', () => {
  const result = evaluateLaunchPreflight({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pass | Ops | release-123 |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '',
    runbookStatus: new Map([
      ['docs/ops/dispatch-sla-alert-drill.md', true],
      ['docs/ops/maps-provider-alert-drill.md', true],
      ['docs/ops/mysql-backup-restore-drill.md', true],
    ]),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(
    result.blockers.at(-1),
    'PHP runtime was not supplied. Set TALABIX_PREFLIGHT_PHP_VERSION=8.3.x before relying on API test gates.'
  );
});

test('reports ready when evidence, runbooks, and PHP runtime meet launch gates', () => {
  const result = evaluateLaunchPreflight({
    launchEvidence: `
## Required Before Production Traffic

| Area | Required evidence | Status | Owner | Evidence link or note |
| ---- | ----------------- | ------ | ----- | --------------------- |
| Staging deployment | Smoke checks passed | Pass | Ops | release-123 |
| Baseline monitoring | Monitors configured | Ready | Ops | monitor-board |
`,
    composerJson: JSON.stringify({
      require: {
        php: '^8.3',
      },
    }),
    phpVersion: '8.3.0',
    runbookStatus: new Map([
      ['docs/ops/dispatch-sla-alert-drill.md', true],
      ['docs/ops/maps-provider-alert-drill.md', true],
      ['docs/ops/mysql-backup-restore-drill.md', true],
    ]),
  });

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.blockers, []);
});

test('parses semantic versions from raw PHP version output', () => {
  assert.deepEqual(parseSemanticVersion('PHP 8.3.2 (cli)'), {
    major: 8,
    minor: 3,
    patch: 2,
    raw: '8.3.2',
  });
});
