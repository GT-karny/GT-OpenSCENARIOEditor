/**
 * Pure helper functions for immutable updates on Maneuver catalog entries.
 * Used by the Maneuver catalog editor to manage nested Event/Action/Trigger structures.
 */

import type { Maneuver, ScenarioEvent, ScenarioAction } from '@osce/shared';
import { createEventFromPartial, createActionFromPartial } from '@osce/scenario-engine';

// ── Event helpers ──────────────────────────────────────────────────────

export function addManeuverEvent(maneuver: Maneuver): Maneuver {
  const count = maneuver.events.length + 1;
  const newEvent = createEventFromPartial({ name: `Event${count}` });
  return { ...maneuver, events: [...maneuver.events, newEvent] };
}

export function removeManeuverEvent(maneuver: Maneuver, eventIndex: number): Maneuver {
  return { ...maneuver, events: maneuver.events.filter((_, i) => i !== eventIndex) };
}

export function updateManeuverEvent(
  maneuver: Maneuver,
  eventIndex: number,
  updatedEvent: ScenarioEvent,
): Maneuver {
  const events = [...maneuver.events];
  events[eventIndex] = updatedEvent;
  return { ...maneuver, events };
}

export function reorderManeuverEvents(
  maneuver: Maneuver,
  fromIndex: number,
  toIndex: number,
): Maneuver {
  const events = [...maneuver.events];
  const [moved] = events.splice(fromIndex, 1);
  events.splice(toIndex, 0, moved);
  return { ...maneuver, events };
}

// ── Action helpers ─────────────────────────────────────────────────────

export function addEventAction(event: ScenarioEvent): ScenarioEvent {
  const count = event.actions.length + 1;
  const newAction = createActionFromPartial({ name: `Action${count}` });
  return { ...event, actions: [...event.actions, newAction] };
}

export function removeEventAction(event: ScenarioEvent, actionIndex: number): ScenarioEvent {
  return { ...event, actions: event.actions.filter((_, i) => i !== actionIndex) };
}

export function updateEventAction(
  event: ScenarioEvent,
  actionIndex: number,
  updatedAction: ScenarioAction,
): ScenarioEvent {
  const actions = [...event.actions];
  actions[actionIndex] = updatedAction;
  return { ...event, actions };
}

export function reorderEventActions(
  event: ScenarioEvent,
  fromIndex: number,
  toIndex: number,
): ScenarioEvent {
  const actions = [...event.actions];
  const [moved] = actions.splice(fromIndex, 1);
  actions.splice(toIndex, 0, moved);
  return { ...event, actions };
}
