/**
 * Re-emit the passthrough content captured by the parser's node tracker.
 *
 * {@link applyExtra} merges an {@link OdrExtra} back onto a serializer node after
 * its known fields are built: unmodeled attributes and child elements are
 * restored verbatim, giving lossless round-trip. Extra children are appended
 * after the known ones (approximating original order via their index) — the
 * relative position need not match exactly, only re-parse equivalence.
 */
import type { OdrExtra } from '@osce/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

const ATTR_PREFIX = '@_';

export function applyExtra(node: XmlNode, extra: OdrExtra | undefined): XmlNode {
  if (!extra) return node;

  if (extra.attrs) {
    for (const [name, value] of Object.entries(extra.attrs)) {
      const key = ATTR_PREFIX + name;
      // Never overwrite a known field the builder already emitted.
      if (!(key in node)) node[key] = value;
    }
  }

  if (extra.children) {
    const ordered = [...extra.children].sort((a, b) => a.index - b.index);
    for (const child of ordered) {
      if (!(child.name in node)) node[child.name] = child.raw;
    }
  }

  return node;
}
