/**
 * Immer patch-plugin activation.
 *
 * `produceWithPatches` / `applyPatches` require immer's optional "patches"
 * plugin to be enabled. `enablePatches()` must run exactly once per process
 * before any patch-producing `produce` call. Importing this module from every
 * command file guarantees the plugin is active regardless of load order, and
 * the module body runs only once thanks to ES module caching.
 */

import { enablePatches } from 'immer';

enablePatches();
