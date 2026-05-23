/** Shallow compare for memoized list rows (Instruction 20.85). */
export function shallowEqualProps(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  keys: string[],
): boolean {
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function stableListKey(id: string, revision?: string | number): string {
  return revision != null ? `${id}:${revision}` : id;
}
