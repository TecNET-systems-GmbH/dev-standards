#!/usr/bin/env node
// PreToolUse hook (Edit|Write): deny edits to generated / build-output files.
//
// Turns the "never hand-edit generated files" convention from a CLAUDE.md *suggestion*
// (which an agent can forget) into a hard *guarantee* (the hook runs regardless).
//
// Defaults cover the common cases; a project overrides them with .claude/protected-paths.json
// (a JSON array of path fragments, e.g. ["src/generated/", "/schema/generated.prisma"]).
import { readFileSync } from 'node:fs';

const DEFAULTS = ['src/generated/', '/generated.prisma', '/dist/', '/build/', '/.next/', 'node_modules/'];

function loadPatterns(projectDir) {
  try {
    const arr = JSON.parse(readFileSync(`${projectDir}/.claude/protected-paths.json`, 'utf8'));
    if (Array.isArray(arr) && arr.every((p) => typeof p === 'string')) return arr;
  } catch {
    // no override file — fall back to defaults
  }
  return DEFAULTS;
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return; // allow — nothing to inspect
  }

  const file = payload?.tool_input?.file_path;
  if (typeof file !== 'string') return;

  const norm = file.replace(/\\/g, '/');
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? '.';
  const hit = loadPatterns(projectDir).find((p) => norm.includes(p));
  if (!hit) return; // allow — no output, exit 0

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Blocked: "${norm}" matches a generated/build path ("${hit}"). ` +
          'Edit the source and regenerate instead. (Override via .claude/protected-paths.json.)',
      },
    }),
  );
}

main();
