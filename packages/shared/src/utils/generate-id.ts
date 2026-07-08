/**
 * Generates a unique identifier (RFC 4122 v4 UUID).
 *
 * Single source of truth for element id generation across packages.
 * Uses the platform `crypto.randomUUID` (available in modern browsers and
 * Node 19+), so no external dependency is required.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
