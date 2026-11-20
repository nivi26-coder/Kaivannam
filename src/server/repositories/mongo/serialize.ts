/**
 * Turns lean Mongo results into plain data: ObjectIds and Dates become
 * strings, matching the shapes in src/domain/types.ts. Needed because
 * ObjectIds and Dates can't be passed to Client Components.
 */
export function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
