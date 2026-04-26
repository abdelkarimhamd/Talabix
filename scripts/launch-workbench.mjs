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
      nextAction: nextActionFor(status, category, note),
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
    externalAccessChecklist: externalAccessChecklistFor(areas),
    nextActions: nextActionsFor(areas, runbooks, warnings),
  };
}

export function formatWorkbenchReport(result) {
  const externalAccessChecklist = result.externalAccessChecklist ?? [];
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

  if (externalAccessChecklist.length > 0) {
    lines.push('', 'External access checklist:');
    lines.push(
      ...externalAccessChecklist.map(
        (item) => `- ${item.area} (${item.owner}): provide ${item.request}.`
      )
    );
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

export function externalAccessChecklistFor(areas) {
  return areas
    .filter((area) => area.category === 'external-access')
    .map((area) => ({
      area: area.area,
      owner: area.owner || 'Unassigned',
      request: normalizeAccessRequest(
        normalizeBlockerDetail(area.note) || area.evidence || area.area
      ),
    }));
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

function nextActionFor(status, category, note) {
  if (status === 'Ready') {
    return 'Keep evidence current before promotion.';
  }

  if (category === 'external-access') {
    const detail = normalizeBlockerDetail(note);

    if (detail) {
      return `Resolve external blocker: ${detail}.`;
    }

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
    actions.push('Share the external access checklist with Ops.');
    actions.push('Keep external blockers marked Blocked until access exists.');
  }

  if (runbooks.some((runbook) => runbook.status === 'missing')) {
    actions.push('Create the missing launch runbook files.');
  }

  if (warnings.length > 0) {
    actions.push(
      'After evidence changes, run launch:preflight with a PHP 8.3 runtime value.'
    );
    actions.push(
      "PowerShell: $env:TALABIX_PREFLIGHT_PHP_VERSION='8.3.30'; npm.cmd run launch:preflight"
    );
    actions.push(
      'POSIX shells: TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight'
    );
  }

  if (actions.length === 0) {
    actions.push(
      'Run npm run launch:preflight before any staging or live promotion.'
    );
  }

  return actions;
}

function normalizeBlockerDetail(note) {
  const detail = String(note || '')
    .replace(/^Blocked:\s*/i, '')
    .trim()
    .replace(/[.。]+$/u, '');

  return detail || '';
}

function normalizeAccessRequest(detail) {
  return String(detail || '')
    .trim()
    .replace(/\s+(is|are)\s+not\s+available(?:\s+in\s+this\s+workspace)?$/i, '')
    .replace(/\s+(is|are)\s+missing(?:\s+from\s+this\s+workspace)?$/i, '')
    .replace(/\s+unavailable(?:\s+in\s+this\s+workspace)?$/i, '')
    .replace(/[.ã€‚]+$/u, '')
    .trim();
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
