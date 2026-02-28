/**
 * Generates osi_version.proto from osi_version.proto.in
 * by substituting @VERSION_MAJOR@, @VERSION_MINOR@, @VERSION_PATCH@
 * with values from the VERSION file.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const osiDir = resolve(__dirname, '../../../Thirdparty/open-simulation-interface');

const versionFile = resolve(osiDir, 'VERSION');
const templateFile = resolve(osiDir, 'osi_version.proto.in');
const outputFile = resolve(osiDir, 'osi_version.proto');

// Skip if already generated
if (existsSync(outputFile)) {
  console.log('osi_version.proto already exists, skipping generation.');
  process.exit(0);
}

// Parse VERSION file (format: "VERSION_MAJOR = 3\nVERSION_MINOR = 7\n...")
const versionContent = readFileSync(versionFile, 'utf-8');
const versions = {};
for (const line of versionContent.split('\n')) {
  const match = line.match(/^(VERSION_\w+)\s*=\s*(\d+)/);
  if (match) {
    versions[match[1]] = match[2];
  }
}

if (!versions.VERSION_MAJOR || !versions.VERSION_MINOR || !versions.VERSION_PATCH) {
  console.error('Failed to parse VERSION file:', versionContent);
  process.exit(1);
}

// Replace template variables
let template = readFileSync(templateFile, 'utf-8');
template = template.replace(/@VERSION_MAJOR@/g, versions.VERSION_MAJOR);
template = template.replace(/@VERSION_MINOR@/g, versions.VERSION_MINOR);
template = template.replace(/@VERSION_PATCH@/g, versions.VERSION_PATCH);

writeFileSync(outputFile, template, 'utf-8');
console.log(`Generated osi_version.proto (v${versions.VERSION_MAJOR}.${versions.VERSION_MINOR}.${versions.VERSION_PATCH})`);
