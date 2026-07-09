#!/usr/bin/env node
// PostToolUse hook (Edit|Write): format + apply safe fixes to the file Claude just edited.
//
// "Format-on-touch" — the low-disruption way to adopt a standard in an existing project:
// only the single edited file is reformatted, so the codebase converges to the standard
// file-by-file as people naturally touch files, instead of one blame-destroying big-bang diff.
//
// Cross-platform (Node, not bash/PowerShell) so it behaves identically on Windows and CI.
// Never blocks and is silent on any error: if the project doesn't use Biome, it is a no-op.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CODE_RE = /\.(m?[jt]sx?|cjs|json|jsonc|css|scss)$/;

function main() {
  let payload;
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return; // no / invalid stdin — nothing to do
  }

  const file = payload?.tool_input?.file_path;
  if (typeof file !== 'string' || !CODE_RE.test(file)) return;

  try {
    // Local Biome only (--no-install): a project without Biome installed → silent no-op.
    // check --write applies formatting + import sorting + SAFE fixes; unsafe fixes are left for the agent.
    execSync(`npx --no-install @biomejs/biome check --write ${JSON.stringify(file)}`, {
      stdio: 'ignore',
    });
  } catch {
    // Biome absent, or lint findings remain (non-zero exit) — formatting was still applied. Never block.
  }
}

main();
