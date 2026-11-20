import type { FieldErrors } from "@/domain/custom-fields";

// Services return a Result instead of throwing for expected problems
// ("artist paused", "invalid phone"). Callers must handle both cases, and
// throwing is kept for real bugs and outages.

export type Ok<T> = { ok: true; value: T };
export type Fail = { ok: false; error: string; fieldErrors?: FieldErrors };
export type Result<T = undefined> = Ok<T> | Fail;

export function ok(): Ok<undefined>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T | undefined> {
  return { ok: true, value };
}

export function fail(error: string, fieldErrors?: FieldErrors): Fail {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}
