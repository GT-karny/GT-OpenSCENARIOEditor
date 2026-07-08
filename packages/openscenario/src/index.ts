export { XoscParser } from './parser/xosc-parser.js';
export { XoscSerializer } from './serializer/xosc-serializer.js';
export { XoscValidator } from './validator/xosc-validator.js';
export { parseCatalogXml } from './parser/parse-catalog.js';
export { serializeCatalog } from './serializer/build-catalog.js';
export { parseParameterValueDistributionXml } from './parser/parse-parameter-distribution.js';
export {
  serializeParameterValueDistribution,
  serializeParameterValueDistributionFormatted,
} from './serializer/build-parameter-distribution.js';
export { XoscRootMismatchError } from './parser/xosc-root-error.js';
export type { XoscRootKind } from './parser/xosc-root-error.js';
export { resolveParameters, applyParameterAssignments } from './resolver/catalog-resolver.js';

export type {
  IXoscParser,
  IXoscSerializer,
  IValidator,
  ValidationResult,
  ValidationIssue,
  ScenarioDocument,
} from '@osce/shared';
