import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const capabilitiesDir = resolve(root, 'docs/maturity/capabilities');
const outputMdPath = resolve(root, 'docs/maturity/matrix.md');
const outputJsonPath = resolve(root, 'docs/maturity/matrix.json');

const LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4'];
const LEVEL_INDEX = new Map(LEVELS.map((l, i) => [l, i]));

function listCapabilityFiles() {
  return readdirSync(capabilitiesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => resolve(capabilitiesDir, f))
    .filter((p) => statSync(p).isFile());
}

function loadCapabilities() {
  const files = listCapabilityFiles();
  const all = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, 'utf-8'));
    if (!Array.isArray(data.capabilities)) continue;
    for (const cap of data.capabilities) {
      all.push(cap);
    }
  }
  return all;
}

function effectiveLevel(cap) {
  const idx = LEVEL_INDEX.get(cap.current_level) ?? 0;
  if (idx >= 2) {
    const hasImpl = Array.isArray(cap.evidence?.impl) && cap.evidence.impl.length > 0;
    const hasTests = Array.isArray(cap.evidence?.tests) && cap.evidence.tests.length > 0;
    if (!hasImpl || !hasTests) return 'L1';
  }
  return cap.current_level;
}

function effectiveStatus(cap, effLevel) {
  if (cap.status === 'done') {
    const req = LEVEL_INDEX.get(cap.required_level) ?? 0;
    const cur = LEVEL_INDEX.get(effLevel) ?? 0;
    const hasImpl = Array.isArray(cap.evidence?.impl) && cap.evidence.impl.length > 0;
    const hasTests = Array.isArray(cap.evidence?.tests) && cap.evidence.tests.length > 0;
    if (cur < req || !hasImpl || (req >= 2 && !hasTests)) {
      return 'partial';
    }
  }
  return cap.status;
}

function asLinks(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '-';
  return items.map((p) => `\`${p}\``).join('<br>');
}

function asBullets(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '-';
  return items.map((x) => `- ${x}`).join('<br>');
}

const capabilities = loadCapabilities().map((cap) => {
  const effLevel = effectiveLevel(cap);
  const effStatus = effectiveStatus(cap, effLevel);
  return { ...cap, effective_level: effLevel, effective_status: effStatus };
});

const domains = [...new Set(capabilities.map((c) => c.domain))].sort();
const summary = domains.map((d) => {
  const subset = capabilities.filter((c) => c.domain === d);
  const byStatus = {
    done: subset.filter((c) => c.effective_status === 'done').length,
    partial: subset.filter((c) => c.effective_status === 'partial').length,
    gap: subset.filter((c) => c.effective_status === 'gap').length,
    blocked: subset.filter((c) => c.effective_status === 'blocked').length,
  };
  return { domain: d, total: subset.length, ...byStatus };
});

const matrixPayload = {
  generated_at: new Date().toISOString(),
  total: capabilities.length,
  domains: summary,
  capabilities,
};
writeFileSync(outputJsonPath, JSON.stringify(matrixPayload, null, 2), 'utf-8');

let md = '';
md += '# Capability Checklist + Matrix\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;
md += '## サマリー\n\n';
md += '| Domain | Total | Done | Partial | Gap | Blocked |\n';
md += '|---|---:|---:|---:|---:|---:|\n';
for (const s of summary) {
  md += `| ${s.domain} | ${s.total} | ${s.done} | ${s.partial} | ${s.gap} | ${s.blocked} |\n`;
}

md += '\n## チェックリスト\n\n';
for (const domain of domains) {
  md += `### ${domain}\n\n`;
  const subset = capabilities
    .filter((c) => c.domain === domain)
    .sort((a, b) => {
      const pa = LEVEL_INDEX.get(a.effective_level) ?? 0;
      const pb = LEVEL_INDEX.get(b.effective_level) ?? 0;
      return pa - pb || a.id.localeCompare(b.id);
    });
  for (const c of subset) {
    const checked = c.effective_status === 'done' ? 'x' : ' ';
    md += `- [${checked}] \`${c.id}\` ${c.title_ja} (${c.effective_level}/${c.required_level}, ${c.effective_status})\n`;
  }
  md += '\n';
}

md += '## Matrix\n\n';
md += '| ID | Domain | Capability | Meaning | Purpose | Required | Current | Effective | Status | Implementation | Tests | E2E | Ops | Gaps | Owner | Target |\n';
md += '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const c of capabilities) {
  md += `| \`${c.id}\` | ${c.domain} | ${c.title_ja} | ${c.meaning_ja ?? '-'} | ${c.purpose_ja ?? '-'} | ${c.required_level} | ${c.current_level} | ${c.effective_level} | ${c.effective_status} | ${asLinks(c.evidence?.impl)} | ${asLinks(c.evidence?.tests)} | ${asLinks(c.evidence?.e2e)} | ${asLinks(c.evidence?.ops)} | ${asBullets(c.gaps_ja)} | ${c.owner} | ${c.target_date} |\n`;
}

md += '\n## 受け入れ条件（Capability別）\n\n';
for (const c of capabilities) {
  md += `### ${c.id}\n\n`;
  md += `${c.title_ja}\n\n`;
  md += `- 機能の意味: ${c.meaning_ja ?? '-'}\n`;
  md += `- 目的: ${c.purpose_ja ?? '-'}\n`;
  md += `- 対象範囲: ${c.scope_ja ?? '-'}\n`;
  md += `- 完了定義: ${c.done_definition_ja ?? '-'}\n\n`;
  md += `検証手順:\n${asBullets(c.verification_steps_ja)}\n\n`;
  md += `受け入れ条件:\n`;
  md += `${asBullets(c.acceptance_criteria_ja)}\n\n`;
}

writeFileSync(outputMdPath, md, 'utf-8');
console.log(`Generated: ${outputMdPath}`);
console.log(`Generated: ${outputJsonPath}`);
