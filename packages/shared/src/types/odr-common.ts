/**
 * OpenDRIVE common types shared across multiple categories.
 */

export interface OdrLaneValidity {
  fromLane: number;
  toLane: number;
}

export interface OdrDataQuality {
  error?: OdrDataQualityError;
  rawData?: OdrDataQualityRawData;
}

export interface OdrDataQualityError {
  xyAbsolute: number;
  zAbsolute: number;
  xyRelative: number;
  zRelative: number;
}

export interface OdrDataQualityRawData {
  date?: string;
  source?: string;
  sourceComment?: string;
  postProcessing?: string;
  postProcessingComment?: string;
}

export interface OdrInclude {
  file: string;
}

export interface OdrUserData {
  code: string;
  value?: string;
}

/**
 * A child element present in the source XML but not mapped to a typed field.
 * Captured verbatim (in the parser's fast-xml-parser representation) so it can
 * be re-emitted unchanged on serialize, giving lossless round-trip for content
 * the typed model does not (yet) understand.
 */
export interface OdrExtraChild {
  /** Element tag name. */
  name: string;
  /** Parsed value for this tag (single object or array), stored verbatim. */
  raw: unknown;
  /** Position among the node's child-element keys — a best-effort sibling-order hint. */
  index: number;
}

/**
 * Unconsumed attributes and child elements of an OpenDRIVE node, preserved so a
 * strict-whitelist parser/serializer no longer silently drops unmodeled content
 * (semantics, crossPath, crossSectionSurface, vendor attrs, …) on load→save.
 */
export interface OdrExtra {
  /** Attributes not mapped to a typed field, keyed by bare (unprefixed) name. */
  attrs?: Record<string, string>;
  /** Child elements not mapped to a typed field, in original sibling order. */
  children?: OdrExtraChild[];
}
