# Local Launch Readiness Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only `npm run launch:workbench` command that reports launch readiness gaps, separating local evidence work from external staging/live blockers.

**Architecture:** Add a focused Node module beside the existing launch preflight script. Reuse `parseLaunchEvidenceRows` and `parseSemanticVersion` from `scripts/launch-preflight.mjs`, then layer workbench-specific row classification, runbook checks, safe output redaction, and terminal formatting on top.

**Tech Stack:** Node ESM, `node:test`, `node:assert/strict`, existing npm scripts.

---

## File Structure

- Create `scripts/launch-workbench.mjs`: workbench evaluator, row classification, redaction, report formatter, and CLI entry point.
- Create `scripts/launch-workbench.test.mjs`: Node tests for classification, missing evidence/runbooks, redaction, and report output.
- Modify `scripts/run-shared-tests.mjs`: import the new workbench test file so `npm run test:shared` covers it.
- Modify `package.json`: add `launch:workbench`.
- Modify `docs/continuous-improvement-log.md`: append a concise implementation entry after validation.

## Task 1: Red Tests For Workbench Classification

**Files:**

- Create: `scripts/launch-workbench.test.mjs`
- Later modify: `scripts/launch-workbench.mjs`

- [ ] **Step 1: Write the failing test file**

Create `scripts/launch-workbench.test.mjs` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyLaunchEvidenceRows,
  evaluateLaunchWorkbench,
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
        'Add the missing staging key, provider dashboard link, log-drain monitor link, or incident-tool evidence when access exists.',
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
    nextActions: ['Keep external blockers marked Blocked until access exists.'],
  });

  assert.match(report, /^Talabix launch workbench: blocked/);
  assert.match(
    report,
    /Maps provider alerts: Blocked \(external-access\) - Add staging key and monitor links\./
  );
  assert.match(report, /docs\/ops\/maps-provider-alert-drill\.md: present/);
  assert.match(report, /Suggested next local actions:/);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
node scripts/launch-workbench.test.mjs
```

Expected: FAIL with `Cannot find module ... scripts/launch-workbench.mjs` or missing exported function errors.

## Task 2: Minimal Workbench Implementation

**Files:**

- Create: `scripts/launch-workbench.mjs`
- Test: `scripts/launch-workbench.test.mjs`

- [ ] **Step 1: Add minimal implementation**

Create `scripts/launch-workbench.mjs` with:

```js
/* global console, process */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseLaunchEvidenceRows,
  parseSemanticVersion,
} from './launch-preflight.mjs';

const LAUNCH_EVIDENCE_PATH = 'docs/ops/launch-evidence.md';
const API_COMPOSER_PATH = 'apps/api/composer.json';
const REQUIRED_RUNBOOKS = [
  'docs/ops/dispatch-sla-alert-drill.md',
  'docs/ops/maps-provider-alert-drill.md',
  'docs/ops/mysql-backup-restore-drill.md',
];

const READY_STATUSES = new Set([
  'complete',
  'completed',
  'done',
  'pass',
  'passed',
  'ready',
]);

const EXTERNAL_ACCESS_PATTERN =
  /\b(staging|provider dashboard|dashboard link|log-drain|log drain|monitor link|alert destination|incident|google maps key|backup host|backup disk|maintenance host|credential|secret|access)\b/i;

export function classifyLaunchEvidenceRows(rows) {
  return rows.map((row) => {
    const rawStatus = row.status || 'Missing';
    const note = row.note || '';
    const status = normalizeAreaStatus(rawStatus, note);
    const category = categorizeArea(status, rawStatus, note);

    return {
      area: row.area,
      evidence: row.evidence,
      status,
      rawStatus,
      owner: row.owner,
      note,
      category,
      nextAction: nextActionFor(status, category),
    };
  });
}

export function evaluateLaunchWorkbench({
  rootDir = process.cwd(),
  launchEvidence,
  composerJson,
  phpVersion = process.env.TALABIX_PREFLIGHT_PHP_VERSION ?? '',
  runbookStatus,
} = {}) {
  const evidenceText =
    launchEvidence ?? readText(rootDir, LAUNCH_EVIDENCE_PATH);
  const rows = parseLaunchEvidenceRows(evidenceText);
  const areas =
    rows.length > 0
      ? classifyLaunchEvidenceRows(rows)
      : [
          {
            area: 'Launch evidence record',
            evidence: LAUNCH_EVIDENCE_PATH,
            status: 'Pending',
            rawStatus: 'Missing',
            owner: '',
            note: `${LAUNCH_EVIDENCE_PATH} is missing or has no required launch evidence rows.`,
            category: 'local-evidence',
            nextAction: `Create or complete ${LAUNCH_EVIDENCE_PATH}.`,
          },
        ];

  const resolvedRunbooks =
    runbookStatus ?? runbookExistenceMap(rootDir, REQUIRED_RUNBOOKS);
  const runbooks = REQUIRED_RUNBOOKS.map((path) => ({
    path,
    status: resolvedRunbooks.get(path) === true ? 'present' : 'missing',
    category: resolvedRunbooks.get(path) === true ? 'ready' : 'local-evidence',
  }));

  const warnings = [];
  const apiComposerJson = composerJson ?? readText(rootDir, API_COMPOSER_PATH);
  const phpRequirement = parsePhpRequirement(apiComposerJson);
  const parsedPhpVersion = parseSemanticVersion(phpVersion);

  if (phpRequirement && !parsedPhpVersion) {
    warnings.push(
      'Set TALABIX_PREFLIGHT_PHP_VERSION=8.3.x when running launch:preflight.'
    );
  } else if (
    phpRequirement &&
    parsedPhpVersion &&
    compareVersions(parsedPhpVersion, phpRequirement.minimum) < 0
  ) {
    warnings.push(
      `PHP runtime ${parsedPhpVersion.raw} is below the API requirement ${phpRequirement.raw}.`
    );
  }

  const blocked =
    areas.some((area) => area.status !== 'Ready') ||
    runbooks.some((runbook) => runbook.status !== 'present');

  return {
    status: blocked ? 'blocked' : 'ready',
    areas,
    runbooks,
    warnings,
    nextActions: nextActionsFor(areas, runbooks, warnings),
  };
}

export function formatWorkbenchReport(result) {
  const lines = [`Talabix launch workbench: ${result.status}`, '', 'Areas:'];

  lines.push(
    ...result.areas.map(
      (area) =>
        `- ${area.area}: ${area.status} (${area.category}) - ${area.nextAction}`
    )
  );

  lines.push('', 'Runbooks:');
  lines.push(
    ...result.runbooks.map((runbook) => `- ${runbook.path}: ${runbook.status}`)
  );

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    lines.push(...result.warnings.map((warning) => `- ${warning}`));
  }

  lines.push('', 'Suggested next local actions:');
  lines.push(...result.nextActions.map((action) => `- ${action}`));

  return `${redactWorkbenchOutput(lines.join('\n'))}\n`;
}

export function redactWorkbenchOutput(output) {
  return String(output)
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-google-api-key]')
    .replace(/https?:\/\/[^\s/:@]+:[^\s@]+@[^\s)]+/g, '[redacted-dsn]')
    .replace(
      /\b(GOOGLE_MAPS_API_KEY|SENTRY_LARAVEL_DSN|SENTRY_DSN)=\S+/g,
      '$1=[redacted-secret]'
    )
    .replace(
      /\b(GOOGLE_MAPS_API_KEY)=\[redacted-secret\]/g,
      '$1=[redacted-google-api-key]'
    );
}

function normalizeAreaStatus(rawStatus, note) {
  const status = String(rawStatus || '')
    .trim()
    .toLowerCase();

  if (READY_STATUSES.has(status)) {
    return 'Ready';
  }

  if (status === 'blocked' || /^blocked:/i.test(note)) {
    return 'Blocked';
  }

  return 'Pending';
}

function categorizeArea(status, rawStatus, note) {
  if (status === 'Ready') {
    return 'ready';
  }

  if (EXTERNAL_ACCESS_PATTERN.test(note)) {
    return 'external-access';
  }

  if (status === 'Pending' || String(rawStatus).trim() === '') {
    return 'local-evidence';
  }

  return 'unknown';
}

function nextActionFor(status, category) {
  if (status === 'Ready') {
    return 'Keep evidence current before promotion.';
  }

  if (category === 'external-access') {
    return 'Add the missing staging key, provider dashboard link, log-drain monitor link, or incident-tool evidence when access exists.';
  }

  if (category === 'local-evidence') {
    return 'Record the missing local evidence or mark the row Blocked with a concrete dependency.';
  }

  return 'Clarify the blocker in the evidence note.';
}

function nextActionsFor(areas, runbooks, warnings) {
  const actions = [];

  if (areas.some((area) => area.category === 'local-evidence')) {
    actions.push('Fill missing local evidence notes before staging.');
  }

  if (areas.some((area) => area.category === 'external-access')) {
    actions.push('Keep external blockers marked Blocked until access exists.');
  }

  if (runbooks.some((runbook) => runbook.status === 'missing')) {
    actions.push('Create the missing launch runbook files.');
  }

  if (warnings.length > 0) {
    actions.push(
      'Run TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight after evidence changes.'
    );
  }

  if (actions.length === 0) {
    actions.push(
      'Run npm run launch:preflight before any staging or live promotion.'
    );
  }

  return actions;
}

function runbookExistenceMap(rootDir, runbooks) {
  return new Map(
    runbooks.map((runbook) => [runbook, existsSync(join(rootDir, runbook))])
  );
}

function parsePhpRequirement(composerJson) {
  let parsed;

  try {
    parsed = JSON.parse(composerJson || '{}');
  } catch {
    return null;
  }

  const raw = parsed?.require?.php;

  if (typeof raw !== 'string') {
    return null;
  }

  const minimum = parseSemanticVersion(raw);

  return minimum
    ? {
        raw,
        minimum,
      }
    : null;
}

function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }

  return 0;
}

function readText(rootDir, path) {
  try {
    return readFileSync(join(rootDir, path), 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const result = evaluateLaunchWorkbench();
  console.log(formatWorkbenchReport(result));
}

const executedPath = process.argv[1] ? resolve(process.argv[1]) : '';

if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 2: Run tests to verify GREEN**

Run:

```bash
node scripts/launch-workbench.test.mjs
```

Expected: PASS, 5 tests.

## Task 3: Script Wiring And Shared Test Integration

**Files:**

- Modify: `package.json`
- Modify: `scripts/run-shared-tests.mjs`
- Test: `scripts/launch-workbench.test.mjs`

- [ ] **Step 1: Add npm script**

In `package.json`, add this entry after `launch:preflight`:

```json
"launch:workbench": "node scripts/launch-workbench.mjs",
```

- [ ] **Step 2: Add test to shared runner**

In `scripts/run-shared-tests.mjs`, add:

```js
import './launch-workbench.test.mjs';
```

after the existing launch preflight test import.

- [ ] **Step 3: Run shared tests**

Run:

```bash
npm run test:shared
```

Expected: PASS with existing shared/i18n/schema/preflight tests plus 5 workbench tests.

- [ ] **Step 4: Run workbench command**

Run:

```bash
npm run launch:workbench
```

Expected: exit 0 and output beginning with `Talabix launch workbench: blocked`, because local evidence still has pending/blocked rows.

## Task 4: Documentation Log And Final Verification

**Files:**

- Modify: `docs/continuous-improvement-log.md`
- Verify: `scripts/launch-workbench.mjs`
- Verify: `scripts/launch-workbench.test.mjs`
- Verify: `scripts/run-shared-tests.mjs`
- Verify: `package.json`

- [ ] **Step 1: Add improvement log entry**

Prepend this entry to `docs/continuous-improvement-log.md`:

```md
## 2026-04-20 - Local launch readiness workbench

### Issues Found

- Launch preflight correctly blocked production promotion, but it did not give operators a local workbench view that separates repo-local evidence gaps from external staging access blockers.
- Maps provider drill evidence could be marked blocked locally, but operators still had to inspect the evidence file by hand to understand which blockers were local versus external.

### Fixes Implemented

- Added `scripts/launch-workbench.mjs` and `npm run launch:workbench`.
- Classified launch evidence rows as `Ready`, `Pending`, or `Blocked`.
- Categorized non-ready rows as `local-evidence`, `external-access`, or `unknown`.
- Added safe output redaction for Google Maps keys and credential-bearing DSNs.
- Wired workbench coverage into `npm run test:shared`.

### Validation Completed

- Red phase: `node scripts/launch-workbench.test.mjs` failed before `scripts/launch-workbench.mjs` existed.
- Green phase: `node scripts/launch-workbench.test.mjs` passed.
- `npm run test:shared` passed.
- `npm run launch:workbench` reported the current local launch state as blocked with pending local evidence and external maps-provider access blockers.
- `TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight` remained blocked as expected because launch evidence rows are not all ready.

### Risks And Follow-Up Items

- The workbench is a local reporting tool; it does not replace real staging provider dashboard, log-drain, restore, or incident drills.
- The next local slice should fill more evidence rows with safe local proof before live/staging access is introduced.
```

- [ ] **Step 2: Run direct workbench test**

Run:

```bash
node scripts/launch-workbench.test.mjs
```

Expected: PASS, 5 tests.

- [ ] **Step 3: Run shared test suite**

Run:

```bash
npm run test:shared
```

Expected: PASS.

- [ ] **Step 4: Run workbench report**

Run:

```bash
npm run launch:workbench
```

Expected: exit 0 with blocked workbench report and no secrets printed.

- [ ] **Step 5: Run strict preflight**

Run:

```bash
$env:TALABIX_PREFLIGHT_PHP_VERSION='8.3.30'; npm run launch:preflight
```

Expected: exit 1 with launch blockers. This is expected until evidence rows are genuinely ready.

- [ ] **Step 6: Run diff check**

Run:

```bash
git diff --check -- scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs scripts/run-shared-tests.mjs package.json docs/continuous-improvement-log.md
```

Expected: exit 0.

- [ ] **Step 7: Commit focused implementation**

Run:

```bash
git add scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs scripts/run-shared-tests.mjs package.json docs/continuous-improvement-log.md docs/superpowers/plans/2026-04-20-local-launch-readiness-workbench.md
git commit -m "feat: add local launch readiness workbench"
```

Expected: one focused commit containing only the workbench implementation, tests, package wiring, log entry, and plan.
