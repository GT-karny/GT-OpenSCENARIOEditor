/**
 * Compile-time type utilities.
 *
 * Used to "weld" a runtime `as const` discriminator array to its interface
 * union so that any drift between the two (a union member without a matching
 * array entry, or vice versa) surfaces as a type error at the declaration site.
 */

/**
 * Compile-time equality of two types (exact, via mutual assignability).
 * Resolves to `true` only when `A` and `B` are the same type.
 */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * Static assertion helper — instantiate only with `true`. Passing `false`
 * (e.g. from a failing {@link Equals}) is a compile error because the argument
 * no longer satisfies the `extends true` constraint.
 */
export type Assert<T extends true> = T;
