/**
 * Patch-based command base — re-export.
 *
 * The implementation now lives in `@osce/scenario-engine` beside `BaseCommand`
 * so that scenario-engine commands can extend it too (see the command policy in
 * docs/ARCHITECTURE.md). This module path is preserved as a stable re-export so
 * the opendrive-engine command subclasses that import `./patch-command.js`
 * relatively continue to compile and run unchanged. Evaluating this re-export
 * pulls in scenario-engine's patch base, which activates immer's patch plugin.
 */

export { PatchCommand } from '@osce/scenario-engine';
export type { PatchRecipe } from '@osce/scenario-engine';
