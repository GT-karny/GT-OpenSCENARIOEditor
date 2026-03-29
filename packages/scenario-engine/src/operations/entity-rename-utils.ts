/**
 * Utilities for entity rename propagation.
 * Provides deep-replace for entityRef fields across the document tree.
 */

/** Field names that hold a single entity reference (exact match replacement). */
const SINGLE_REF_KEYS = new Set(['entityRef', 'masterEntityRef', 'trailerRef']);

/** Field names that hold an array of entity references. */
const ARRAY_REF_KEYS = new Set(['entityRefs']);

/**
 * Recursively walk an object tree (Immer draft compatible) and replace
 * all entity reference fields matching `oldName` with `newName`.
 *
 * - Single ref fields (`entityRef`, `masterEntityRef`, `trailerRef`): exact match replacement
 * - Array ref fields (`entityRefs`): replace matching elements in-place
 * - Skips `id` fields to avoid false matches.
 */
export function deepReplaceEntityRef(
  obj: unknown,
  oldName: string,
  newName: string,
): void {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        deepReplaceEntityRef(obj[i], oldName, newName);
      }
    }
    return;
  }

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === 'id') continue;

    const val = (obj as Record<string, unknown>)[key];

    if (SINGLE_REF_KEYS.has(key) && typeof val === 'string' && val === oldName) {
      (obj as Record<string, string>)[key] = newName;
    } else if (ARRAY_REF_KEYS.has(key) && Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (val[i] === oldName) val[i] = newName;
      }
    } else if (typeof val === 'object' && val !== null) {
      deepReplaceEntityRef(val, oldName, newName);
    }
  }
}

/**
 * Remove all occurrences of `entityName` from entity reference fields.
 * - Array ref fields (`entityRefs`): filter out matching elements
 * - Single ref fields (`entityRef`, etc.): set to empty string
 */
export function deepRemoveEntityRef(
  obj: unknown,
  entityName: string,
): void {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        deepRemoveEntityRef(obj[i], entityName);
      }
    }
    return;
  }

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === 'id') continue;

    const val = (obj as Record<string, unknown>)[key];

    if (SINGLE_REF_KEYS.has(key) && typeof val === 'string' && val === entityName) {
      (obj as Record<string, string>)[key] = '';
    } else if (ARRAY_REF_KEYS.has(key) && Array.isArray(val)) {
      for (let i = val.length - 1; i >= 0; i--) {
        if (val[i] === entityName) val.splice(i, 1);
      }
    } else if (typeof val === 'object' && val !== null) {
      deepRemoveEntityRef(val, entityName);
    }
  }
}
