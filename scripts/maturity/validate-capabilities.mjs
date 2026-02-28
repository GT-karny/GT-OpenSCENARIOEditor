import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const capabilitiesDir = resolve(root, 'docs/maturity/capabilities');
const schemaPath = resolve(root, 'docs/maturity/schema/capability.schema.json');

const LEVELS = new Set(['L0', 'L1', 'L2', 'L3', 'L4']);
const STATUS = new Set(['gap', 'partial', 'done', 'blocked']);
const DOMAINS = new Set([
  'core',
  'opendrive',
  'ux',
  '3d',
  'sim',
  'backend',
  'mcp',
  'templates',
  'i18n',
  'qa',
  'devops',
]);

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
if (!schema?.properties?.domain?.enum) {
  throw new Error('schema file is invalid');
}

const files = readdirSync(capabilitiesDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => resolve(capabilitiesDir, f))
  .filter((p) => statSync(p).isFile());

const errors = [];
const seenIds = new Set();
let total = 0;

function addError(file, idx, msg) {
  errors.push(`${file}#${idx + 1}: ${msg}`);
}

function isDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function ensureStringArray(value, file, idx, field, min = 0) {
  if (!Array.isArray(value)) {
    addError(file, idx, `${field} must be array`);
    return;
  }
  if (value.length < min) {
    addError(file, idx, `${field} must include at least ${min} items`);
  }
  value.forEach((it, i) => {
    if (typeof it !== 'string' || it.trim() === '') {
      addError(file, idx, `${field}[${i}] must be non-empty string`);
    }
  });
}

for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  if (!Array.isArray(data.capabilities)) {
    errors.push(`${file}: capabilities must be array`);
    continue;
  }

  for (let i = 0; i < data.capabilities.length; i++) {
    const c = data.capabilities[i];
    total++;

    const required = [
      'id',
      'domain',
      'title_ja',
      'meaning_ja',
      'purpose_ja',
      'scope_ja',
      'done_definition_ja',
      'verification_steps_ja',
      'required_level',
      'current_level',
      'status',
      'acceptance_criteria_ja',
      'evidence',
      'owner',
      'target_date',
    ];
    for (const key of required) {
      if (!(key in c)) addError(file, i, `missing required field: ${key}`);
    }

    if (typeof c.id !== 'string' || !/^[a-z0-9]+(\.[a-z0-9_]+)+$/.test(c.id)) {
      addError(file, i, 'id format invalid');
    } else if (seenIds.has(c.id)) {
      addError(file, i, `duplicated id: ${c.id}`);
    } else {
      seenIds.add(c.id);
    }

    if (!DOMAINS.has(c.domain)) addError(file, i, `domain invalid: ${c.domain}`);
    if (typeof c.title_ja !== 'string' || c.title_ja.trim() === '') addError(file, i, 'title_ja required');
    if (typeof c.meaning_ja !== 'string' || c.meaning_ja.trim() === '') addError(file, i, 'meaning_ja required');
    if (typeof c.purpose_ja !== 'string' || c.purpose_ja.trim() === '') addError(file, i, 'purpose_ja required');
    if (typeof c.scope_ja !== 'string' || c.scope_ja.trim() === '') addError(file, i, 'scope_ja required');
    if (typeof c.done_definition_ja !== 'string' || c.done_definition_ja.trim() === '') addError(file, i, 'done_definition_ja required');
    ensureStringArray(c.verification_steps_ja, file, i, 'verification_steps_ja', 1);
    if (!LEVELS.has(c.required_level)) addError(file, i, `required_level invalid: ${c.required_level}`);
    if (!LEVELS.has(c.current_level)) addError(file, i, `current_level invalid: ${c.current_level}`);
    if (!STATUS.has(c.status)) addError(file, i, `status invalid: ${c.status}`);

    ensureStringArray(c.acceptance_criteria_ja, file, i, 'acceptance_criteria_ja', 1);
    ensureStringArray(c.gaps_ja ?? [], file, i, 'gaps_ja');
    ensureStringArray(c.depends_on ?? [], file, i, 'depends_on');

    if (typeof c.owner !== 'string' || c.owner.trim() === '') addError(file, i, 'owner required');
    if (typeof c.target_date !== 'string' || !isDate(c.target_date)) addError(file, i, 'target_date invalid');

    if (!c.evidence || typeof c.evidence !== 'object') {
      addError(file, i, 'evidence required');
      continue;
    }
    ensureStringArray(c.evidence.impl, file, i, 'evidence.impl', 1);
    ensureStringArray(c.evidence.tests, file, i, 'evidence.tests', 0);
    ensureStringArray(c.evidence.e2e ?? [], file, i, 'evidence.e2e');
    ensureStringArray(c.evidence.ops ?? [], file, i, 'evidence.ops');

    // Rule: L2+ requires impl + tests
    const lvl = Number(String(c.current_level).replace('L', ''));
    if (lvl >= 2 && (!Array.isArray(c.evidence.tests) || c.evidence.tests.length === 0)) {
      addError(file, i, 'current_level >= L2 requires at least one evidence.tests');
    }
  }
}

if (total < 80) {
  errors.push(`total capabilities must be >= 80 (actual: ${total})`);
}

if (errors.length > 0) {
  console.error('Capability validation failed:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log(`Capability validation passed. files=${files.length}, total=${total}`);
