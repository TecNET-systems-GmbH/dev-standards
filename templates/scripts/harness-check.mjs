#!/usr/bin/env node
// Harness health: surfaces periodic project-maintenance checks (defined in .harness/status.json) that
// are OVERDUE, so Claude Code sees them at session start and can offer to run them. Never blocks, no deps.
//
// The "when did we last run it" state lives in .harness/status.json (committed → shared, git-history
// independent so it also works on shallow CI clones). Cadence per check = `everyDays`.
//
// Modes:
//   (default)              human-readable summary of all checks
//   --hook                 emit { additionalContext } for the SessionStart hook (silent when healthy)
//   --record <id> [note]   stamp a check as run today, then commit .harness/status.json to reset it
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATUS = resolve(ROOT, '.harness/status.json');

function daysSince(iso) {
  return iso ? (Date.now() - new Date(iso).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
}

function overdue(data) {
  return Object.entries(data.checks)
    .map(([id, c]) => ({ id, ...c, age: daysSince(c.lastRun) }))
    .filter((c) => c.age > c.everyDays)
    .sort((a, b) => b.age / b.everyDays - a.age / a.everyDays);
}

const fmtAge = (age) => (age === Number.POSITIVE_INFINITY ? 'never run' : `${Math.floor(age)}d ago`);
const args = process.argv.slice(2);
const hookMode = args[0] === '--hook';

if (!existsSync(STATUS)) {
  if (!hookMode) console.error(`harness: no ${STATUS} — nothing to check`);
  process.exit(0);
}

const data = JSON.parse(readFileSync(STATUS, 'utf8'));

if (args[0] === '--record') {
  const id = args[1];
  const note = args.slice(2).join(' ');
  if (!id || !data.checks[id]) {
    console.error(`harness: unknown check "${id}". Known: ${Object.keys(data.checks).join(', ')}`);
    process.exit(1);
  }
  data.checks[id].lastRun = new Date().toISOString().slice(0, 10);
  if (note) data.checks[id].note = note;
  writeFileSync(STATUS, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `harness: recorded "${id}" (${data.checks[id].lastRun}). Commit .harness/status.json to reset the clock.`,
  );
  process.exit(0);
}

const due = overdue(data);

if (hookMode) {
  if (due.length === 0) process.exit(0); // stay silent when everything is current
  const lines = due.map(
    (c) => `- ${c.id}: ${fmtAge(c.age)} (cadence ${c.everyDays}d)${c.note ? ` — last: ${c.note}` : ''}`,
  );
  const additionalContext = [
    'Harness maintenance is overdue. Offer to run these (the developer is NOT blocked — just surface and offer):',
    ...lines,
    'After running one, record it: `node scripts/harness-check.mjs --record <id> "<short status>"` and commit .harness/status.json.',
  ].join('\n');
  process.stdout.write(JSON.stringify({ additionalContext }));
  process.exit(0);
}

if (due.length === 0) {
  console.log('harness: all checks current ✓');
} else {
  console.log('harness: overdue checks:');
  for (const c of due) console.log(`  ⚠ ${c.id}: ${fmtAge(c.age)} (every ${c.everyDays}d)`);
}
