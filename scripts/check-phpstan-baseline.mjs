/* global console, process */

import fs from 'node:fs';
import path from 'node:path';

const baselinePath = path.resolve('apps/api/phpstan-baseline.neon');

if (!fs.existsSync(baselinePath)) {
  process.exit(0);
}

const baseline = fs.readFileSync(baselinePath, 'utf8');
const reasonMatch = baseline.match(/^\s*#\s*baseline-reason:\s*(.+)$/im);

if (reasonMatch?.[1]?.trim()) {
  process.exit(0);
}

console.error(
  [
    'apps/api/phpstan-baseline.neon was reintroduced without an explicit reason.',
    'Add a non-empty comment near the top of the baseline file in this format:',
    '# baseline-reason: <why this temporary PHPStan debt is being accepted>',
  ].join('\n'),
);

process.exit(1);
