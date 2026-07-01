/**
 * Theme tokens for the shared route/trajectory edit primitives.
 *
 * Route editing uses a blue/cyan palette; trajectory editing uses orange/amber.
 * The shared marker/line/gizmo primitives take one of these theme objects so a
 * single implementation renders both stacks with their existing look.
 */
export interface EditPrimitiveTheme {
  /** Marker/line colour when unselected. */
  color: string;
  /** Marker/line colour when selected (shared yellow highlight for both stacks). */
  selectedColor: string;
  /** Default connection-line colour. */
  lineColor: string;
  /** HTML label text colour when unselected. */
  labelColor: string;
  /** HTML label background when unselected. */
  labelBg: string;
  /** HTML label background when selected. */
  labelSelectedBg: string;
}

export const ROUTE_EDIT_THEME: EditPrimitiveTheme = {
  color: '#00CCCC',
  selectedColor: '#FFCC00',
  lineColor: '#00AAFF',
  labelColor: '#FFFFFF',
  labelBg: 'rgba(0,0,0,0.6)',
  labelSelectedBg: 'rgba(60,60,0,0.8)',
};

export const TRAJECTORY_EDIT_THEME: EditPrimitiveTheme = {
  color: '#FF8800',
  selectedColor: '#FFCC00',
  lineColor: '#FF8800',
  labelColor: '#FFFFFF',
  labelBg: 'rgba(40,20,0,0.7)',
  labelSelectedBg: 'rgba(60,40,0,0.8)',
};
