/* global console, process */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export function parseLaunchEvidenceRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sectionStart = lines.findIndex((line) =>
    /^##\s+Required Before Production Traffic\s*$/i.test(line.trim())
  );

  if (sectionStart === -1) {
    return [];
  }

  const rows = [];

  for (const line of lines.slice(sectionStart + 1)) {
    const trimmed = line.trim();

    if (/^##\s+/.test(trimmed)) {
      break;
    }

    if (!trimmed.startsWith('|')) {
      continue;
    }

    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());

    if (cells.length < 5 || isHeaderRow(cells) || isSeparatorRow(cells)) {
      continue;
    }

    rows.push({
      area: cells[0],
      evidence: cells[1],
      status: cells[2],
      owner: cells[3],
      note: cells[4],
    });
  }

  return rows;
}

export function evaluateLaunchPreflight({
  rootDir = process.cwd(),
  launchEvidence,
  composerJson,
  phpVersion = process.env.TALABIX_PREFLIGHT_PHP_VERSION ?? '',
  runbookStatus,
} = {}) {
  const blockers = [];
  const warnings = [];
  const checks = [];

  const evidenceRows = parseLaunchEvidenceRows(launchEvidence ?? '');

  if (evidenceRows.length === 0) {
    blockers.push(
      `No required launch evidence rows were found in ${LAUNCH_EVIDENCE_PATH}.`
    );
  }

  for (const row of evidenceRows) {
    const status = row.status || 'Missing';

    if (!READY_STATUSES.has(status.toLowerCase())) {
      blockers.push(
        `${row.area} evidence is ${status}. Complete the evidence row in ${LAUNCH_EVIDENCE_PATH}.`
      );
    }
  }

  checks.push({
    name: 'Launch evidence',
    status: evidenceRows.length > 0 ? 'checked' : 'missing',
    detail: `${evidenceRows.length} required evidence row(s) inspected`,
  });

  const resolvedRunbooks =
    runbookStatus ?? runbookExistenceMap(rootDir, REQUIRED_RUNBOOKS);

  for (const runbook of REQUIRED_RUNBOOKS) {
    if (resolvedRunbooks.get(runbook) !== true) {
      blockers.push(`Required runbook ${runbook} is missing.`);
    }
  }

  checks.push({
    name: 'Launch runbooks',
    status: REQUIRED_RUNBOOKS.every((runbook) => resolvedRunbooks.get(runbook))
      ? 'checked'
      : 'missing',
    detail: `${REQUIRED_RUNBOOKS.length} required runbook(s) inspected`,
  });

  const phpRequirement = parsePhpRequirement(composerJson ?? '{}');
  const parsedPhpVersion = parseSemanticVersion(phpVersion);

  if (phpRequirement && parsedPhpVersion) {
    if (compareVersions(parsedPhpVersion, phpRequirement.minimum) < 0) {
      blockers.push(
        `PHP runtime ${parsedPhpVersion.raw} is below the API requirement ${phpRequirement.raw}.`
      );
    }

    checks.push({
      name: 'PHP runtime',
      status: 'checked',
      detail: `${parsedPhpVersion.raw} checked against ${phpRequirement.raw}`,
    });
  } else if (phpRequirement) {
    blockers.push(
      `PHP runtime was not supplied. Set TALABIX_PREFLIGHT_PHP_VERSION=8.3.x before relying on API test gates.`
    );
    checks.push({
      name: 'PHP runtime',
      status: 'not checked',
      detail: `API requirement is ${phpRequirement.raw}`,
    });
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    warnings,
    checks,
  };
}

export function parseSemanticVersion(value) {
  const match = String(value).match(/(\d+)\.(\d+)(?:\.(\d+))?/);

  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3] ?? '0', 10),
    raw: match[3]
      ? `${match[1]}.${match[2]}.${match[3]}`
      : `${match[1]}.${match[2]}.0`,
  };
}

function runbookExistenceMap(rootDir, runbooks) {
  return new Map(
    runbooks.map((runbook) => [runbook, existsSync(join(rootDir, runbook))])
  );
}

function parsePhpRequirement(composerJson) {
  let parsed;

  try {
    parsed = JSON.parse(composerJson);
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

function isHeaderRow(cells) {
  return cells[0]?.toLowerCase() === 'area';
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function readText(rootDir, path) {
  try {
    return readFileSync(join(rootDir, path), 'utf8');
  } catch {
    return '';
  }
}

function formatReport(result) {
  const lines = [`Talabix launch preflight: ${result.status}`];

  if (result.blockers.length > 0) {
    lines.push('', 'Blockers:');
    lines.push(...result.blockers.map((blocker) => `- ${blocker}`));
  }

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    lines.push(...result.warnings.map((warning) => `- ${warning}`));
  }

  lines.push('', 'Checks:');
  lines.push(
    ...result.checks.map(
      (check) => `- ${check.name}: ${check.status} (${check.detail})`
    )
  );

  return `${lines.join('\n')}\n`;
}

function main() {
  const rootDir = process.cwd();
  const result = evaluateLaunchPreflight({
    rootDir,
    launchEvidence: readText(rootDir, LAUNCH_EVIDENCE_PATH),
    composerJson: readText(rootDir, API_COMPOSER_PATH),
  });

  const report = formatReport(result);

  if (result.status === 'blocked') {
    console.error(report);
    process.exitCode = 1;
    return;
  }

  console.log(report);
}

const executedPath = process.argv[1] ? resolve(process.argv[1]) : '';

if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
