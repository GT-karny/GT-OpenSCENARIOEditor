import type { ScenarioDocument, ValidationIssue } from '@osce/shared';

export function validateStructuralRules(
  doc: ScenarioDocument,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  // STRUCT_001: FileHeader required fields
  if (!doc.fileHeader.date && !doc.fileHeader.description) {
    warnings.push({
      code: 'STRUCT_001',
      message: 'FileHeader is missing date and description',
      messageKey: 'validation.struct001',
      severity: 'warning',
      path: 'fileHeader',
    });
  }

  // STRUCT_002: Storyboard required
  if (!doc.storyboard) {
    errors.push({
      code: 'STRUCT_002',
      message: 'Storyboard is required',
      messageKey: 'validation.struct002',
      severity: 'error',
      path: 'storyboard',
    });
    return;
  }

  // STRUCT_003: Every Story must have at least one Act
  for (const story of doc.storyboard.stories) {
    if (story.acts.length === 0) {
      warnings.push({
        code: 'STRUCT_003',
        message: `Story "${story.name}" has no Acts`,
        messageKey: 'validation.struct003',
        severity: 'warning',
        path: `storyboard.stories.${story.name}`,
        elementId: story.id,
      });
    }

    // STRUCT_004: Every Act must have a StartTrigger
    for (const act of story.acts) {
      if (!act.startTrigger || act.startTrigger.conditionGroups.length === 0) {
        warnings.push({
          code: 'STRUCT_004',
          message: `Act "${act.name}" has an empty StartTrigger`,
          messageKey: 'validation.struct004',
          severity: 'warning',
          path: `storyboard.stories.${story.name}.acts.${act.name}`,
          elementId: act.id,
        });
      }

      // STRUCT_005: Every Event must have a StartTrigger
      for (const mg of act.maneuverGroups) {
        // STRUCT_006: ManeuverGroup must have Actors
        if (mg.actors.entityRefs.length === 0 && !mg.actors.selectTriggeringEntities) {
          warnings.push({
            code: 'STRUCT_006',
            message: `ManeuverGroup "${mg.name}" has no actors`,
            messageKey: 'validation.struct006',
            severity: 'warning',
            path: `storyboard.stories.${story.name}.acts.${act.name}.maneuverGroups.${mg.name}`,
            elementId: mg.id,
          });
        }

        for (const maneuver of mg.maneuvers) {
          for (const event of maneuver.events) {
            if (!event.startTrigger || event.startTrigger.conditionGroups.length === 0) {
              warnings.push({
                code: 'STRUCT_005',
                message: `Event "${event.name}" has an empty StartTrigger`,
                messageKey: 'validation.struct005',
                severity: 'warning',
                path: `storyboard.stories.${story.name}.acts.${act.name}.events.${event.name}`,
                elementId: event.id,
              });
            }
          }
        }
      }
    }
  }

  // STRUCT_007: Every entity must have a valid definition
  for (const entity of doc.entities) {
    if (!entity.definition) {
      errors.push({
        code: 'STRUCT_007',
        message: `Entity "${entity.name}" has no definition`,
        messageKey: 'validation.struct007',
        severity: 'error',
        path: `entities.${entity.name}`,
        elementId: entity.id,
      });
    }
  }
}
