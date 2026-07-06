/**
 * WASM consistency guard.
 *
 * The compiled esmini WASM artifact (apps/web/public/wasm/esmini.js) is a
 * manually-committed binary built from the GT_Sim submodule; nothing in CI
 * rebuilds it. Drift between the committed blob, the submodule pin it was built
 * from, and the provenance recorded in docs/development/wasm-build.md can go
 * unnoticed. This script fails when they disagree.
 *
 * It reads the machine-readable provenance block from wasm-build.md and checks:
 *   (a) the recorded submodule pin equals the gitlink commit that HEAD records
 *       for Thirdparty/GT_Sim (read via `git ls-tree`; no submodule checkout
 *       required, so this works in a CI checkout without submodules), and
 *   (b) the recorded sha256 + size equal the actual bytes of the committed
 *       esmini.js.
 *
 * On any mismatch it names what drifted and how to fix it, then exits 1.
 *
 * Zero runtime dependencies (Node builtins only); mirrors scripts/maturity/*.
 */

import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const DOC_PATH = 'docs/development/wasm-build.md';
const SUBMODULE_PATH = 'Thirdparty/GT_Sim';
const BEGIN = '<!-- wasm-provenance:begin -->';
const END = '<!-- wasm-provenance:end -->';

const REMEDIATION =
  `If you deliberately rebuilt the WASM artifact, update the provenance block in ${DOC_PATH}\n` +
  '(submodule_pin / sha256 / size_bytes) in the SAME commit as the new esmini.js.\n' +
  'See the "運用注記" (operations note) section of that document for the full procedure.';

/** Print the collected errors and exit non-zero. */
function fail(messages) {
  console.error('WASM consistency check FAILED:\n');
  for (const m of messages) console.error(`  - ${m}`);
  console.error(`\n${REMEDIATION}`);
  process.exit(1);
}

/** Extract `key: value` pairs from the provenance block, or fail hard. */
function parseProvenance() {
  const docFull = resolve(root, DOC_PATH);
  let text;
  try {
    text = readFileSync(docFull, 'utf-8');
  } catch {
    fail([`cannot read ${DOC_PATH}`]);
  }

  const begin = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (begin === -1 || end === -1 || end < begin) {
    fail([`provenance block (${BEGIN} … ${END}) not found in ${DOC_PATH}`]);
  }

  const block = text.slice(begin + BEGIN.length, end);
  const provenance = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([a-z0-9_]+)\s*:\s*(.+?)\s*$/);
    if (m) provenance[m[1]] = m[2];
  }

  const missing = ['submodule_pin', 'file', 'sha256', 'size_bytes'].filter(
    (k) => !provenance[k],
  );
  if (missing.length) {
    fail(missing.map((k) => `provenance block missing field: ${k}`));
  }
  return provenance;
}

/** Read the gitlink commit HEAD records for the submodule path. */
function readSubmodulePin(errors) {
  let out;
  try {
    out = execFileSync('git', ['ls-tree', 'HEAD', SUBMODULE_PATH], {
      cwd: root,
      encoding: 'utf-8',
    }).trim();
  } catch (e) {
    errors.push(`git ls-tree HEAD ${SUBMODULE_PATH} failed: ${e.message}`);
    return undefined;
  }
  // Format: "<mode> <type> <object>\t<path>", e.g. "160000 commit <sha>\tThirdparty/GT_Sim"
  const parts = out.split(/\s+/);
  if (parts[0] !== '160000' || parts[1] !== 'commit' || !parts[2]) {
    errors.push(
      `${SUBMODULE_PATH} is not a submodule gitlink at HEAD (git ls-tree: "${out}")`,
    );
    return undefined;
  }
  return parts[2];
}

const provenance = parseProvenance();
const errors = [];

// (a) submodule pin
const actualPin = readSubmodulePin(errors);
if (actualPin && actualPin !== provenance.submodule_pin) {
  errors.push(
    `submodule pin drift: provenance records ${provenance.submodule_pin} but HEAD ` +
      `records ${actualPin} for ${SUBMODULE_PATH}`,
  );
}

// (b) artifact sha256 + size
const fileFull = resolve(root, provenance.file);
let buf;
try {
  buf = readFileSync(fileFull);
} catch {
  errors.push(`cannot read WASM artifact: ${provenance.file}`);
}
if (buf) {
  const actualSha = createHash('sha256').update(buf).digest('hex');
  if (actualSha !== provenance.sha256) {
    errors.push(
      `sha256 drift for ${provenance.file}: provenance records ${provenance.sha256} ` +
        `but file hashes to ${actualSha}`,
    );
  }
  const recordedSize = Number(provenance.size_bytes);
  const actualSize = statSync(fileFull).size;
  if (!Number.isInteger(recordedSize)) {
    errors.push(`size_bytes is not an integer: "${provenance.size_bytes}"`);
  } else if (actualSize !== recordedSize) {
    errors.push(
      `size drift for ${provenance.file}: provenance records ${recordedSize} ` +
        `but file is ${actualSize} bytes`,
    );
  }
}

if (errors.length) fail(errors);

console.log(
  `WASM consistency check passed. pin=${provenance.submodule_pin.slice(0, 12)}… ` +
    `sha256=${provenance.sha256.slice(0, 12)}… size=${provenance.size_bytes} bytes`,
);
