# Local Launch Readiness Workbench Design

## Purpose

Talabix will stay local until the repository can prove that the launch checklist, runbooks, local validation commands, and blocker records are complete enough to move into staging or live work. The Local Launch Readiness Workbench gives operators one local command that explains what is ready, what is still pending local work, and what is blocked only by external staging or provider access.

The workbench does not replace staging drills. It prepares the repo for those drills by making all local requirements visible, repeatable, and testable.

## Goals

- Add a local command, `npm run launch:workbench`, that prints a structured readiness report.
- Reuse the existing launch evidence record instead of creating a second source of truth.
- Classify each launch area as `Ready`, `Pending`, or `Blocked`.
- Separate local repo gaps from external staging/live blockers.
- Report actionable next steps for each non-ready area.
- Keep secrets, API keys, DSNs, customer data, screenshots, and private monitor URLs out of generated output.
- Keep `npm run launch:preflight` as the strict promotion gate.

## Non-Goals

- Do not connect to Google Cloud, Datadog, New Relic, Sentry, production hosts, or staging hosts.
- Do not create real provider dashboard alerts or log-drain monitors.
- Do not persist real Google Maps keys or other secrets.
- Do not turn blocked external dependencies into passing evidence.
- Do not run destructive database backup or restore operations.

## User Flow

An operator runs:

```bash
npm run launch:workbench
```

The command reads local repo files and prints:

- Overall readiness status.
- A table of required launch areas.
- For each area, the current status, evidence note, blocker category, and next local action.
- Required runbook status.
- Optional command hints for local validation, such as API tests in Docker PHP 8.3, shared tests, and `launch:preflight`.

When the report sees a `Blocked` area, it must state the missing external dependency plainly. For example, maps provider alerts can remain blocked until the real staging Google Maps key, provider dashboard links, and log-drain monitor links exist.

## Architecture

The workbench extends the existing Node-based launch tooling:

- `scripts/launch-preflight.mjs` remains the strict evidence gate.
- A new `scripts/launch-workbench.mjs` imports shared parsing helpers where useful and adds operator-oriented classification.
- New tests cover parsing, classification, and output-safe behavior.
- `package.json` gets a `launch:workbench` script.

The implementation should avoid shelling out to PHP, Docker, or cloud CLIs by default. This keeps the command usable on restricted local machines. The report can include command hints, but it should not claim those commands passed unless they were explicitly executed by a separate verification step.

## Readiness Classification

The workbench classifies evidence rows from `docs/ops/launch-evidence.md`:

- `Ready`: status is one of `Ready`, `Pass`, `Passed`, `Complete`, `Completed`, or `Done`.
- `Blocked`: status is `Blocked`, or the evidence note begins with `Blocked:`.
- `Pending`: status is empty, `Pending`, or any other non-ready status that is not explicitly blocked.

For non-ready rows, the workbench assigns a blocker category:

- `local-evidence`: documentation, tests, command output, or local proof is missing.
- `external-access`: staging keys, provider dashboard links, log-drain monitor links, backup host access, or incident-tool access is missing.
- `unknown`: the row is non-ready but does not explain why.

The command should prefer explicit blocker text from the evidence note. It should not infer secrets, URLs, or provider names that are not present in repo files.

## Output Shape

The command prints plain text suitable for terminal and automation logs:

```text
Talabix launch workbench: blocked

Areas:
- Staging deployment: Pending (local-evidence) - add local smoke evidence or staging deploy proof
- Baseline monitoring: Pending (local-evidence) - record selected monitor plan and local evidence
- Maps provider alerts: Blocked (external-access) - staging key and monitor links missing

Runbooks:
- docs/ops/maps-provider-alert-drill.md: present

Suggested next local actions:
- Fill missing local evidence notes before staging.
- Keep external blockers marked Blocked until access exists.
- Run TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight after evidence changes.
```

The exact wording can evolve, but tests should lock the important behavior: status, row classification, blocker category, and safe omission of secrets.

## Error Handling

- If `docs/ops/launch-evidence.md` is missing, report `blocked` with a clear local-evidence blocker.
- If required runbooks are missing, report them as local-evidence blockers.
- If `apps/api/composer.json` cannot be parsed, warn that the PHP runtime requirement could not be checked.
- If `TALABIX_PREFLIGHT_PHP_VERSION` is missing, suggest setting it for `launch:preflight`; do not fail the workbench solely for that.

## Testing

Add local Node tests for:

- Ready, pending, and blocked evidence rows.
- Evidence notes that begin with `Blocked:` becoming `external-access` when they mention staging keys, provider dashboards, log drains, backup hosts, or incident tools.
- Missing evidence file behavior.
- Missing required runbook behavior.
- Output redaction behavior for strings that look like API keys or DSNs.
- Integration with the existing shared test runner.

Verification commands for this slice:

```bash
node scripts/launch-workbench.test.mjs
npm run test:shared
npm run launch:workbench
TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight
git diff --check
```

`launch:preflight` is expected to remain blocked until launch evidence rows are genuinely ready. A blocked preflight is acceptable if the blocker list matches the evidence file.

## Rollout

This is a local-only feature. It should ship as repository tooling and documentation only. After it is merged, operators can use the workbench to drive the remaining local readiness tasks before moving to staging credentials, live provider dashboards, and external alert drills.
