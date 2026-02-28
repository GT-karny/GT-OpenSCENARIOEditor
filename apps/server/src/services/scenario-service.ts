import { XoscParser, XoscSerializer, XoscValidator } from '@osce/openscenario';
import { XodrParser } from '@osce/opendrive';
import type { ScenarioDocument } from '@osce/shared';
import type { OpenDriveDocument, ValidationResult } from '@osce/shared';
import { ParseError } from '../utils/errors.js';

export class ScenarioService {
  private readonly xoscParser = new XoscParser();
  private readonly xoscSerializer = new XoscSerializer();
  private readonly xoscValidator = new XoscValidator();
  private readonly xodrParser = new XodrParser();

  parseXosc(xml: string): ScenarioDocument {
    try {
      return this.xoscParser.parse(xml);
    } catch (err: unknown) {
      throw new ParseError(`Failed to parse XOSC: ${(err as Error).message}`);
    }
  }

  serializeXosc(doc: ScenarioDocument): string {
    try {
      return this.xoscSerializer.serializeFormatted(doc);
    } catch (err: unknown) {
      throw new ParseError(`Failed to serialize XOSC: ${(err as Error).message}`);
    }
  }

  parseXodr(xml: string): OpenDriveDocument {
    try {
      return this.xodrParser.parse(xml);
    } catch (err: unknown) {
      throw new ParseError(`Failed to parse XODR: ${(err as Error).message}`);
    }
  }

  validate(doc: ScenarioDocument): ValidationResult {
    return this.xoscValidator.validate(doc);
  }
}
