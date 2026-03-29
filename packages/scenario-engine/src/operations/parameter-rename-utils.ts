/**
 * Utilities for parameter rename propagation.
 * Provides generic deep-replace for $ParamName references across the document tree.
 */

/**
 * Escape special regex characters in a string.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively walk an object tree (Immer draft compatible) and replace
 * all occurrences of `$oldName` with `$newName` in string values.
 *
 * Skips `id` fields and non-user-data keys to avoid false matches.
 */
export function deepReplaceParamRef(
  obj: unknown,
  oldName: string,
  newName: string,
): void {
  if (typeof obj !== 'object' || obj === null) return;

  const regex = new RegExp(`\\$${escapeRegex(oldName)}(?=\\b|$)`, 'g');
  const replacement = `$${newName}`;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = (obj[i] as string).replace(regex, replacement);
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        deepReplaceParamRef(obj[i], oldName, newName);
      }
    }
    return;
  }

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    // Skip internal id fields to avoid false positives
    if (key === 'id') continue;

    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'string') {
      (obj as Record<string, string>)[key] = val.replace(regex, replacement);
    } else if (typeof val === 'object' && val !== null) {
      deepReplaceParamRef(val, oldName, newName);
    }
  }
}

/**
 * Recursively walk an object tree and replace direct (non-$) references
 * in a specific field name. For example, `parameterRef` or `variableRef`
 * fields that store the declaration name directly.
 *
 * Uses exact string match (not regex) on the field value.
 * Skips `id` fields to avoid false matches.
 */
export function deepReplaceDirectRef(
  obj: unknown,
  fieldName: string,
  oldName: string,
  newName: string,
): void {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        deepReplaceDirectRef(obj[i], fieldName, oldName, newName);
      }
    }
    return;
  }

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === 'id') continue;

    const val = (obj as Record<string, unknown>)[key];
    if (key === fieldName && typeof val === 'string' && val === oldName) {
      (obj as Record<string, string>)[key] = newName;
    } else if (typeof val === 'object' && val !== null) {
      deepReplaceDirectRef(val, fieldName, oldName, newName);
    }
  }
}

/**
 * Replace `$oldName` references in parameterBindings map values.
 */
export function replaceInBindings(
  bindings: Record<string, Record<string, string>>,
  oldName: string,
  newName: string,
): void {
  const regex = new RegExp(`\\$${escapeRegex(oldName)}(?=\\b|$)`, 'g');
  const replacement = `$${newName}`;

  for (const elementBindings of Object.values(bindings)) {
    for (const [field, ref] of Object.entries(elementBindings)) {
      elementBindings[field] = ref.replace(regex, replacement);
    }
  }
}
