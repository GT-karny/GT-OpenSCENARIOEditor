/**
 * Build XML for a signal's `<semantics>` element (t_signals_semantics, 1.9).
 *
 * Entries are grouped by kind and emitted in XSD sequence order (speed, lane,
 * priority, …). Since a schema-valid document is already kind-grouped, this
 * round-trips the parser's flattened `entries` array losslessly.
 */
import type {
  OdrSignalSemantics,
  OdrSemanticsEntry,
  OdrSemanticsParticipant,
} from '@osce/shared';
import { ODR_SEMANTICS_KINDS } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';
import { applyExtra } from './apply-extra.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

function buildParticipants(node: XmlNode, participants: OdrSemanticsParticipant[]): void {
  const animals: XmlNode[] = [];
  const persons: XmlNode[] = [];
  const vehicles: XmlNode[] = [];
  for (const p of participants) {
    if (p.kind === 'animal') {
      animals.push(applyExtra({}, p.extra));
    } else if (p.kind === 'person') {
      persons.push(applyExtra({ type: p.category }, p.extra));
    } else {
      vehicles.push(applyExtra({ type: p.category }, p.extra));
    }
  }
  // XSD order: animal*, person*, vehicle*.
  if (animals.length > 0) node.animal = animals;
  if (persons.length > 0) node.person = persons;
  if (vehicles.length > 0) node.vehicle = vehicles;
}

function buildEntry(entry: OdrSemanticsEntry): XmlNode {
  const node: XmlNode = {};
  switch (entry.kind) {
    case 'speed':
      optAttr(node, '@_type', entry.type);
      optAttr(node, '@_value', entry.value, fmtNum);
      optAttr(node, '@_unit', entry.unit);
      break;
    case 'lane':
    case 'priority':
    case 'supplementaryEnvironment':
      optAttr(node, '@_type', entry.type);
      break;
    case 'supplementaryTime':
      optAttr(node, '@_type', entry.type);
      optAttr(node, '@_value', entry.value, fmtNum);
      break;
    case 'supplementaryDistance':
      optAttr(node, '@_type', entry.type);
      optAttr(node, '@_value', entry.value, fmtNum);
      optAttr(node, '@_unit', entry.unit);
      break;
    case 'prohibited':
    case 'supplementaryAllows':
    case 'supplementaryProhibits':
      buildParticipants(node, entry.participants);
      break;
    // warning / routing / streetname / parking / tourist / supplementaryExplanatory: no fields.
  }
  return applyExtra(node, entry.extra);
}

export function buildSemantics(semantics: OdrSignalSemantics): XmlNode {
  const node: XmlNode = {};
  for (const kind of ODR_SEMANTICS_KINDS) {
    const ofKind = semantics.entries.filter((e) => e.kind === kind);
    if (ofKind.length > 0) node[kind] = ofKind.map(buildEntry);
  }
  return applyExtra(node, semantics.extra);
}
