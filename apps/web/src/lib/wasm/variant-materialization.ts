/**
 * Materialize a parameter variant into a runnable OpenSCENARIO XML string.
 *
 * The approach is intentionally spec-minimal: rather than substituting
 * `$Parameter` references throughout the document ourselves, we override the
 * matching `parameterDeclarations[].value` and hand the serialized scenario to
 * esmini, which resolves `$`-references at runtime. This keeps materialization
 * a pure clone-and-override pass with no in-editor substitution logic.
 *
 * Variant keys with no matching top-level declaration are skipped (they cannot
 * be applied without inventing a declaration) and surfaced as warnings.
 */

import type { ScenarioDocument } from '@osce/shared';
import { XoscSerializer } from '@osce/openscenario';
import type { ParameterVariant } from '@osce/scenario-engine';

export interface MaterializedVariant {
  /** The serialized scenario XML with variant values applied. */
  xml: string;
  /** Variant parameter names that had no matching top-level declaration. */
  unmatched: string[];
}

/**
 * Clone `document`, override declared parameter values with the variant's
 * assignments, and serialize to XML. Does not mutate the input document.
 */
export function materializeVariant(
  document: ScenarioDocument,
  variant: ParameterVariant,
  serializer: XoscSerializer = new XoscSerializer(),
): MaterializedVariant {
  const declaredNames = new Set(document.parameterDeclarations.map((p) => p.name));
  const unmatched = Object.keys(variant).filter((name) => !declaredNames.has(name));

  const overridden: ScenarioDocument = {
    ...document,
    parameterDeclarations: document.parameterDeclarations.map((decl) =>
      variant[decl.name] !== undefined ? { ...decl, value: variant[decl.name] } : decl,
    ),
  };

  return { xml: serializer.serializeFormatted(overridden), unmatched };
}
