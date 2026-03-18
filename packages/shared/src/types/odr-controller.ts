/**
 * OpenDRIVE controller types.
 */

export interface OdrController {
  id: string;
  name: string;
  sequence?: number;
  controls: { signalId: string; type?: string }[];
}
