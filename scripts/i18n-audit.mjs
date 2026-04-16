/* global console, process */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const roots = [
  'apps/portal-web/src',
  'apps/customer-app/src',
  'apps/rider-app/src',
];

const ignoredPathParts = [
  '__tests__',
  '/test/',
  '/assets/',
];

const ignoredFiles = new Set([
  'apps/customer-app/src/customer-api.js',
  'apps/customer-app/src/mock-data.js',
  'apps/customer-app/src/i18n.js',
  'apps/rider-app/src/rider-api.js',
  'apps/rider-app/src/mock-data.js',
  'apps/rider-app/src/i18n.js',
  'apps/portal-web/src/portal-api.js',
  'apps/portal-web/src/sample-data.js',
  'apps/portal-web/src/session-defaults.js',
  'apps/portal-web/src/i18n-context.jsx',
]);

const allowedText = [
  /^[A-Z]$/,
  /^[A-Z]{2,}$/,
  /^\/[a-z,/ ]+$/i,
  /^[a-z]+:[a-z.]+$/i,
  /^[0-9 .:/-]+$/,
  /^\.\.\.$/,
  /^…$/,
];

const checks = [
  {
    name: 'JSX text',
    regex: />\s*([^<>{}\n]*[A-Za-z][^<>{}\n]*)\s*</g,
    valueIndex: 1,
  },
  {
    name: 'literal user-facing prop',
    regex: /\b(aria-label|placeholder|title|label|description|eyebrow)=["']([^"']*[A-Za-z][^"']*)["']/g,
    valueIndex: 2,
  },
  {
    name: 'literal feedback',
    regex: /\b(setFeedback|alert|confirm)\(\s*["'`]([^"'`]*[A-Za-z][^"'`]*)["'`]/g,
    valueIndex: 2,
  },
];

const findings = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const normalizedFile = file.replaceAll('\\', '/');

    if (ignoredFiles.has(normalizedFile)) {
      continue;
    }

    if (ignoredPathParts.some((part) => normalizedFile.includes(part))) {
      continue;
    }

    if (!['.js', '.jsx'].includes(extname(file))) {
      continue;
    }

    const source = readFileSync(file, 'utf8');

    if (source.includes('i18n-audit: ignore-file')) {
      continue;
    }

    if (!source.includes('i18n-audit: strict')) {
      continue;
    }

    const lines = source.split(/\r?\n/);

    for (const check of checks) {
      for (const match of source.matchAll(check.regex)) {
        const value = match[check.valueIndex].trim();
        const line = lineNumberForOffset(source, match.index ?? 0);

        if (!value || lines[line - 1]?.includes('i18n-audit: ignore-line')) {
          continue;
        }

        if (allowedText.some((pattern) => pattern.test(value))) {
          continue;
        }

        findings.push({
          file: normalizedFile,
          line,
          kind: check.name,
          value,
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error('i18n audit failed. Move user-facing text into packages/shared/src/i18n/index.js.');

  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.kind}] ${finding.value}`);
  }

  process.exit(1);
}

console.log('i18n audit passed: no hardcoded user-facing frontend strings found.');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

function lineNumberForOffset(source, offset) {
  return source.slice(0, offset).split(/\r?\n/).length;
}
