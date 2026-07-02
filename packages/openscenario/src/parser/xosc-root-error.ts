/**
 * Root category of an `<OpenSCENARIO>` document.
 *
 * The XSD `OpenScenarioCategory` group is a choice between three mutually
 * exclusive document shapes. Only `scenario` is a full `ScenarioDefinition`;
 * the other two require dedicated parsers.
 */
export type XoscRootKind = 'scenario' | 'catalog' | 'parameterValueDistribution';

/**
 * Thrown by {@link XoscParser} when a document's root is a `Catalog` or
 * `ParameterValueDistribution` rather than a scenario. Without this guard such
 * files parse to a silently-empty scenario (no `<Storyboard>` → empty default),
 * hiding the real problem. Callers can catch this and route to
 * `parseCatalogXml` / `parseParameterValueDistributionXml` respectively.
 */
export class XoscRootMismatchError extends Error {
  readonly rootKind: 'catalog' | 'parameterValueDistribution';

  constructor(rootKind: 'catalog' | 'parameterValueDistribution') {
    super(
      `<OpenSCENARIO> root is a ${rootKind} document, not a scenario. ` +
        `Use ${
          rootKind === 'catalog' ? 'parseCatalogXml' : 'parseParameterValueDistributionXml'
        } instead.`,
    );
    this.name = 'XoscRootMismatchError';
    this.rootKind = rootKind;
    // Restore prototype chain for `instanceof` across transpilation targets.
    Object.setPrototypeOf(this, XoscRootMismatchError.prototype);
  }
}
