import type { ScenarioDocument, ValidationIssue } from '@osce/shared';

export function validateReferenceRules(
  doc: ScenarioDocument,
  errors: ValidationIssue[],
  _warnings: ValidationIssue[],
): void {
  const entityNames = new Set(doc.entities.map((e) => e.name));
  const paramNames = new Set(doc.parameterDeclarations.map((p) => p.name));

  // Collect all entityRef values from the storyboard
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const mg of act.maneuverGroups) {
        // REF_001: Actor entityRefs must reference existing entities
        for (const ref of mg.actors.entityRefs) {
          if (!entityNames.has(ref) && !ref.startsWith('$')) {
            errors.push({
              code: 'REF_001',
              message: `Entity reference "${ref}" in ManeuverGroup "${mg.name}" does not match any defined entity`,
              messageKey: 'validation.ref001',
              severity: 'error',
              path: `storyboard.maneuverGroups.${mg.name}.actors`,
              elementId: mg.id,
            });
          }
        }
      }
    }
  }

  // REF_001: Init entity refs
  for (const ea of doc.storyboard.init.entityActions) {
    if (!entityNames.has(ea.entityRef) && !ea.entityRef.startsWith('$')) {
      errors.push({
        code: 'REF_001',
        message: `Entity reference "${ea.entityRef}" in Init does not match any defined entity`,
        messageKey: 'validation.ref001',
        severity: 'error',
        path: `storyboard.init.entityActions.${ea.entityRef}`,
        elementId: ea.id,
      });
    }
  }

  // REF_003: Check condition parameter refs
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      checkTriggerParamRefs(act.startTrigger, paramNames, errors, `act.${act.name}.startTrigger`);
      for (const mg of act.maneuverGroups) {
        for (const maneuver of mg.maneuvers) {
          for (const event of maneuver.events) {
            checkTriggerParamRefs(
              event.startTrigger,
              paramNames,
              errors,
              `event.${event.name}.startTrigger`,
            );
          }
        }
      }
    }
  }
}

function checkTriggerParamRefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: any,
  paramNames: Set<string>,
  errors: ValidationIssue[],
  path: string,
): void {
  if (!trigger?.conditionGroups) return;
  for (const cg of trigger.conditionGroups) {
    for (const cond of cg.conditions) {
      const body = cond.condition;
      if (body.kind === 'byValue' && body.valueCondition.type === 'parameter') {
        if (!paramNames.has(body.valueCondition.parameterRef)) {
          errors.push({
            code: 'REF_003',
            message: `Parameter reference "${body.valueCondition.parameterRef}" does not match any declared parameter`,
            messageKey: 'validation.ref003',
            severity: 'error',
            path,
            elementId: cond.id,
          });
        }
      }
    }
  }
}
