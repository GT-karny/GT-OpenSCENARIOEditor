/** Identifies which parameter is highlighted across form and diagram */
export type HighlightKey =
  | 'bb-length'
  | 'bb-width'
  | 'bb-height'
  | 'bb-center-x'
  | 'bb-center-y'
  | 'bb-center-z'
  | 'front-axle-posX'
  | 'front-axle-wheelDia'
  | 'front-axle-trackW'
  | 'front-axle-posZ'
  | 'rear-axle-posX'
  | 'rear-axle-wheelDia'
  | 'rear-axle-trackW'
  | 'rear-axle-posZ'
  | null;

/** Computed layout values for the SVG viewport */
export interface ViewportLayout {
  /** SVG viewBox width in px */
  viewBoxWidth: number;
  /** SVG viewBox height in px */
  viewBoxHeight: number;
  /** Scale factor: px per meter */
  scale: number;
  /** Origin X in SVG coords (where world x=0 maps to) */
  originX: number;
  /** Origin Y in SVG coords (where world z/y=0 maps to) */
  originY: number;
}
