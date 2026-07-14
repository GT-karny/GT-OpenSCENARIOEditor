/**
 * Side-effect imports that register each cluster's execution panels.
 *
 * TRUNK-OWNED (see CLAUDE.local.md ownership rules): each cluster lane ships a
 * `register.ts` inside its own directory that calls `registerExecutionPanel`,
 * and the trunk lane adds one import line here when that cluster lands.
 * Cluster lanes must not edit this file (or ExecutionLayout) themselves.
 */
import './jobs/register';
import './live/register';
import './odr/register';
import './run-form/register';
import './settings/register';
import './verification/register';
