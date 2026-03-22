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
